use chrono::{DateTime, Utc};
use marduk_core::models::{ChatCompletionRequest, ChatMessage};
use marduk_core::scheduler::SchedulerPolicy;
use marduk_core::worker::WorkerId;
use marduk_learned::LearnedSchedulerEngine;
use marduk_nvml::GpuTelemetryEngine;
use marduk_scheduler::Scheduler;
use marduk_worker::WorkerSupervisor;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Instant;
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkConfig {
    pub concurrency: usize,
    pub total_requests: usize,
    pub model: String,
    pub max_tokens: usize,
    pub prompt_text: String,
}

impl Default for BenchmarkConfig {
    fn default() -> Self {
        Self {
            concurrency: 4,
            total_requests: 40,
            model: "mistral-7b-instruct".to_string(),
            max_tokens: 32,
            prompt_text: "Explain the architecture of low-latency GPU inference schedulers in distributed AI systems.".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatencyDistribution {
    pub min_ms: f64,
    pub p50_ms: f64,
    pub p95_ms: f64,
    pub p99_ms: f64,
    pub max_ms: f64,
    pub mean_ms: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkResult {
    pub policy_name: String,
    pub timestamp: DateTime<Utc>,
    pub total_requests: usize,
    pub successful_requests: usize,
    pub failed_requests: usize,
    pub total_duration_secs: f64,
    pub requests_per_second: f64,
    pub tokens_per_second: f64,
    pub total_tokens: usize,
    pub latency: LatencyDistribution,
    pub scheduling_overhead_avg_us: f64,
}

pub struct BenchmarkHarness {
    _telemetry: Arc<GpuTelemetryEngine>,
    supervisor: Arc<WorkerSupervisor>,
    scheduler: Arc<Scheduler>,
    _learned: Arc<LearnedSchedulerEngine>,
}

impl BenchmarkHarness {
    pub fn new() -> Self {
        let telemetry = Arc::new(GpuTelemetryEngine::new(true));
        let supervisor = Arc::new(WorkerSupervisor::new(telemetry.clone(), 64));
        let scheduler = Arc::new(Scheduler::new(
            marduk_core::config::SchedulerConfig::default(),
            telemetry.clone(),
            supervisor.clone(),
        ));
        let learned = Arc::new(LearnedSchedulerEngine::new());

        // Spawn 2 simulated workers (Device 0)
        supervisor
            .spawn_local_worker(
                WorkerId::from("worker-alpha"),
                "Alpha Worker".to_string(),
                0,
                Some("mistral-7b-instruct".to_string()),
                vec!["mistral-7b-instruct".to_string(), "llama-3-8b".to_string()],
            )
            .unwrap();

        supervisor
            .spawn_local_worker(
                WorkerId::from("worker-beta"),
                "Beta Worker".to_string(),
                0,
                Some("mistral-7b-instruct".to_string()),
                vec!["mistral-7b-instruct".to_string()],
            )
            .unwrap();

        Self {
            _telemetry: telemetry,
            supervisor,
            scheduler,
            _learned: learned,
        }
    }

    pub async fn run_benchmark(
        &self,
        config: &BenchmarkConfig,
        policy: SchedulerPolicy,
        policy_name: &str,
    ) -> BenchmarkResult {
        info!(
            "Starting benchmark [{}] - Concurrency: {}, Total Requests: {}",
            policy_name, config.concurrency, config.total_requests
        );

        let completed = Arc::new(AtomicUsize::new(0));
        let failed = Arc::new(AtomicUsize::new(0));
        let total_tokens_gen = Arc::new(AtomicUsize::new(0));
        let latencies = Arc::new(parking_lot::Mutex::new(Vec::with_capacity(
            config.total_requests,
        )));
        let sched_overheads = Arc::new(parking_lot::Mutex::new(Vec::with_capacity(
            config.total_requests,
        )));

        let start_time = Instant::now();

        // Worker tasks
        let mut handles = Vec::new();
        let requests_per_task = config.total_requests / config.concurrency;

        for task_idx in 0..config.concurrency {
            let scheduler = self.scheduler.clone();
            let supervisor = self.supervisor.clone();
            let completed = completed.clone();
            let failed = failed.clone();
            let total_tokens_gen = total_tokens_gen.clone();
            let latencies = latencies.clone();
            let sched_overheads = sched_overheads.clone();
            let config = config.clone();

            handles.push(tokio::spawn(async move {
                for i in 0..requests_per_task {
                    let req_id = format!("bench-{}-{}", task_idx, i);
                    let req = ChatCompletionRequest {
                        model: config.model.clone(),
                        messages: vec![ChatMessage {
                            role: "user".to_string(),
                            content: config.prompt_text.clone(),
                            name: None,
                        }],
                        temperature: Some(0.7),
                        top_p: Some(0.9),
                        max_tokens: Some(config.max_tokens),
                        stream: false,
                        stop: None,
                        priority: None,
                    };

                    let sched_start = Instant::now();
                    let decision_res = scheduler.select_worker(&req_id, &req, policy);
                    let sched_micros = sched_start.elapsed().as_micros() as f64;
                    sched_overheads.lock().push(sched_micros);

                    let req_start = Instant::now();
                    match decision_res {
                        Ok(decision) => {
                            match supervisor.dispatch(&decision.selected_worker_id, req).await {
                                Ok(resp) => {
                                    let req_ms = req_start.elapsed().as_secs_f64() * 1000.0;
                                    latencies.lock().push(req_ms);
                                    total_tokens_gen
                                        .fetch_add(resp.usage.completion_tokens, Ordering::Relaxed);
                                    completed.fetch_add(1, Ordering::Relaxed);
                                }
                                Err(_) => {
                                    failed.fetch_add(1, Ordering::Relaxed);
                                }
                            }
                        }
                        Err(_) => {
                            failed.fetch_add(1, Ordering::Relaxed);
                        }
                    }
                }
            }));
        }

        for h in handles {
            let _ = h.await;
        }

        let total_duration_secs = start_time.elapsed().as_secs_f64();
        let succ = completed.load(Ordering::Relaxed);
        let fail = failed.load(Ordering::Relaxed);
        let tokens = total_tokens_gen.load(Ordering::Relaxed);

        let mut lat_vec = latencies.lock().clone();
        lat_vec.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

        let distribution = if !lat_vec.is_empty() {
            let mean = lat_vec.iter().sum::<f64>() / lat_vec.len() as f64;
            let p50 = lat_vec[(lat_vec.len() as f64 * 0.50) as usize];
            let p95 =
                lat_vec[(lat_vec.len() as f64 * 0.95).min((lat_vec.len() - 1) as f64) as usize];
            let p99 =
                lat_vec[(lat_vec.len() as f64 * 0.99).min((lat_vec.len() - 1) as f64) as usize];
            LatencyDistribution {
                min_ms: lat_vec[0],
                p50_ms: p50,
                p95_ms: p95,
                p99_ms: p99,
                max_ms: *lat_vec.last().unwrap(),
                mean_ms: mean,
            }
        } else {
            LatencyDistribution {
                min_ms: 0.0,
                p50_ms: 0.0,
                p95_ms: 0.0,
                p99_ms: 0.0,
                max_ms: 0.0,
                mean_ms: 0.0,
            }
        };

        let overheads = sched_overheads.lock().clone();
        let avg_overhead = if !overheads.is_empty() {
            overheads.iter().sum::<f64>() / overheads.len() as f64
        } else {
            0.0
        };

        BenchmarkResult {
            policy_name: policy_name.to_string(),
            timestamp: Utc::now(),
            total_requests: config.total_requests,
            successful_requests: succ,
            failed_requests: fail,
            total_duration_secs,
            requests_per_second: succ as f64 / total_duration_secs.max(0.001),
            tokens_per_second: tokens as f64 / total_duration_secs.max(0.001),
            total_tokens: tokens,
            latency: distribution,
            scheduling_overhead_avg_us: avg_overhead,
        }
    }
}

impl Default for BenchmarkHarness {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_benchmark_harness() {
        let harness = BenchmarkHarness::new();
        let config = BenchmarkConfig {
            concurrency: 2,
            total_requests: 6,
            model: "mistral-7b-instruct".to_string(),
            max_tokens: 8,
            prompt_text: "test".to_string(),
        };

        let result = harness
            .run_benchmark(
                &config,
                SchedulerPolicy::DeterministicMultiFactor,
                "DeterministicMultiFactor",
            )
            .await;

        assert_eq!(result.successful_requests, 6);
        assert!(result.requests_per_second > 0.0);
        assert!(result.latency.p50_ms > 0.0);
    }
}
