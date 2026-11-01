pub mod cpu_bench;
pub mod engine;
pub mod hardware;
pub mod rating;
pub mod storage;
pub mod types;
pub mod workloads;

pub use cpu_bench::CpuBenchmarkRunner;
pub use engine::BenchmarkEngine;
pub use hardware::{CpuTopology, GpuTopology, HardwareDiscoveryEngine, SystemHardwareSummary};
pub use rating::{PerformanceRatingEngine, SystemRating};
pub use storage::{BenchmarkJobRecord, LocalBenchmarkStorage, SystemRatingRecord};
pub use types::*;

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
#[serde(default)]
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

    #[tokio::test]
    async fn test_benchmark_engine_capabilities_and_safety_budget() {
        let telemetry = Arc::new(GpuTelemetryEngine::new(false));
        let supervisor = Arc::new(WorkerSupervisor::new(telemetry.clone(), 32));
        let engine = BenchmarkEngine::new(telemetry, supervisor);

        let caps = engine.get_capabilities();
        assert!(caps.safety_vram_reserve_bytes >= 2 * 1024 * 1024 * 1024);
        assert!(!caps.supported_precisions.is_empty());
        assert!(caps.thermal_slowdown_celsius.is_some());
    }

    #[tokio::test]
    async fn test_benchmark_engine_concurrency_prevention() {
        let telemetry = Arc::new(GpuTelemetryEngine::new(false));
        let supervisor = Arc::new(WorkerSupervisor::new(telemetry.clone(), 32));
        let engine = BenchmarkEngine::new(telemetry, supervisor);

        let req1 = RunBenchmarkRequest {
            test_type: BenchmarkType::ComputeCore,
            device_id: Some(0),
            duration_seconds: Some(3),
            precision: Some("FP32".to_string()),
            model_id: None,
            use_cpu: None,
        };

        let run_id = engine.submit_job(req1.clone()).await.expect("First job submits");
        assert!(run_id.starts_with("bench-"));

        // Second immediate job on same device must be rejected
        let req2 = RunBenchmarkRequest {
            test_type: BenchmarkType::VramSpeed,
            device_id: Some(0),
            duration_seconds: Some(3),
            precision: None,
            model_id: None,
            use_cpu: None,
        };

        let err = engine.submit_job(req2).await;
        assert!(err.is_err(), "Concurrent benchmark must be rejected");

        // Cancel the running job
        let cancel_res = engine.cancel_job(&run_id);
        assert!(cancel_res.is_ok(), "Cancellation succeeds");
    }

    #[tokio::test]
    async fn test_benchmark_engine_cancellation_and_job_lifecycle() {
        let telemetry = Arc::new(GpuTelemetryEngine::new(false));
        let supervisor = Arc::new(WorkerSupervisor::new(telemetry.clone(), 32));
        let engine = BenchmarkEngine::new(telemetry, supervisor);

        let req = RunBenchmarkRequest {
            test_type: BenchmarkType::ThermalStability,
            device_id: Some(0),
            duration_seconds: Some(8),
            precision: None,
            model_id: None,
            use_cpu: None,
        };

        let run_id = engine.submit_job(req).await.expect("Job submits");
        let job = engine.get_job(&run_id).expect("Job found in registry");
        assert_eq!(job.test_type, BenchmarkType::ThermalStability);

        // Cancel
        engine.cancel_job(&run_id).unwrap();
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        let cancelled_job = engine.get_job(&run_id).expect("Job found");
        assert_eq!(cancelled_job.status, JobStatus::Cancelled);
    }

    #[test]
    fn test_hardware_discovery() {
        let telemetry = Arc::new(GpuTelemetryEngine::new(false));
        let summary = HardwareDiscoveryEngine::discover_system(&telemetry);

        assert!(!summary.cpu.brand.is_empty());
        assert!(summary.cpu.logical_cores > 0);
        assert!(summary.cpu.total_memory_bytes > 0);
        assert!(!summary.primary_device_name.is_empty());
    }

    #[test]
    fn test_cpu_benchmarks_execution() {
        let cancel = Arc::new(std::sync::atomic::AtomicBool::new(false));

        // Single-Core
        let single_res = CpuBenchmarkRunner::run_single_core(2, &cancel, |_pct, _stage| {})
            .expect("Single-core benchmark must succeed");
        assert!(single_res.achieved_tflops.unwrap_or(0.0) > 0.0);
        assert!(single_res.total_flops.unwrap_or(0) > 0);

        // Multi-Core
        let multi_res = CpuBenchmarkRunner::run_multi_core(2, &cancel, |_pct, _stage| {})
            .expect("Multi-core benchmark must succeed");
        assert!(multi_res.achieved_tflops.unwrap_or(0.0) > 0.0);

        // SIMD
        let simd_res = CpuBenchmarkRunner::run_simd_acceleration(2, &cancel, |_pct, _stage| {})
            .expect("SIMD benchmark must succeed");
        assert!(simd_res.tensor_tflops.unwrap_or(0.0) > 0.0);
        assert!(simd_res.speedup_vs_fp32.unwrap_or(0.0) > 1.0);

        // RAM Bandwidth
        let ram_res = CpuBenchmarkRunner::run_ram_bandwidth(2, &cancel, |_pct, _stage| {})
            .expect("RAM bandwidth benchmark must succeed");
        assert!(ram_res.bandwidth_gbps.unwrap_or(0.0) > 0.0);
    }

    #[test]
    fn test_sqlite_persistence_and_export() {
        let storage = LocalBenchmarkStorage::in_memory().expect("In-memory SQLite initializes");

        let job = BenchmarkJob {
            run_id: "test-run-123".to_string(),
            test_type: BenchmarkType::ComputeCore,
            device_id: 0,
            device_name: "Test Accelerator".to_string(),
            status: JobStatus::Completed,
            progress_percent: 100,
            current_stage: "Completed".to_string(),
            created_at: Utc::now(),
            started_at: Some(Utc::now()),
            ended_at: Some(Utc::now()),
            duration_secs: Some(3.5),
            config: RunBenchmarkRequest {
                test_type: BenchmarkType::ComputeCore,
                device_id: Some(0),
                duration_seconds: Some(3),
                precision: Some("FP32".to_string()),
                model_id: None,
                use_cpu: None,
            },
            hardware_metadata: marduk_core::telemetry::GpuDevice {
                id: 0,
                uuid: "test-uuid".to_string(),
                name: "Test Accelerator".to_string(),
                pci_bus_id: "0000:00:00.0".to_string(),
                compute_capability: Some("8.9".to_string()),
                driver_version: Some("550.0".to_string()),
                cuda_version: Some("12.4".to_string()),
                total_memory_bytes: 8 * 1024 * 1024 * 1024,
            },
            metrics: Some(BenchmarkMetrics {
                duration_ms: 3500.0,
                samples_count: 50,
                achieved_tflops: Some(14.5),
                ..Default::default()
            }),
            safety_events: vec![],
            failure_reason: None,
            rating: None,
        };

        storage.record_run(&job).expect("Run successfully records to SQLite");

        let runs = storage.get_recent_runs(10).expect("Retrieval succeeds");
        assert_eq!(runs.len(), 1);
        assert_eq!(runs[0].id, "test-run-123");
        assert_eq!(runs[0].metrics.as_ref().and_then(|m| m.achieved_tflops), Some(14.5));

        let json = storage.export_json().expect("JSON export succeeds");
        assert!(json.contains("test-run-123"));

        let csv = storage.export_csv().expect("CSV export succeeds");
        assert!(csv.contains("test-run-123"));
    }

    #[test]
    fn test_rating_engine() {
        let gpu_score = PerformanceRatingEngine::compute_gpu_score(82.6, 1008.0, 330.0, 100.0);
        assert!((gpu_score - 10000.0).abs() < 1.0, "Reference 4090 parameters should equal ~10,000 points");

        let cpu_score = PerformanceRatingEngine::compute_cpu_score(120.0, 1800.0, 4.0, 80.0);
        assert!((cpu_score - 10000.0).abs() < 1.0, "Reference high-end CPU parameters should equal ~10,000 points");

        let tier1 = PerformanceRatingEngine::classify_tier(Some(9500.0), 9000.0);
        assert!(tier1.contains("Tier 1"));

        let cpu_tier = PerformanceRatingEngine::classify_tier(None, 6500.0);
        assert!(cpu_tier.contains("CPU Host Profile"));
    }
}
