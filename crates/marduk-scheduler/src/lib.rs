use chrono::Utc;
use marduk_core::config::SchedulerConfig;
use marduk_core::error::{MardukError, Result};
use marduk_core::models::ChatCompletionRequest;
use marduk_core::scheduler::{
    CandidateEvaluation, DisqualificationRecord, SchedulerPolicy, SchedulingDecision,
};
use marduk_core::worker::{WorkerInfo, WorkerStatus};
use marduk_nvml::GpuTelemetryEngine;
use marduk_worker::WorkerSupervisor;
use parking_lot::RwLock;
use std::collections::VecDeque;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tracing::{info, warn};

pub struct Scheduler {
    config: SchedulerConfig,
    telemetry_engine: Arc<GpuTelemetryEngine>,
    worker_supervisor: Arc<WorkerSupervisor>,
    decision_history: Arc<RwLock<VecDeque<SchedulingDecision>>>,
    round_robin_counter: AtomicUsize,
    max_history_size: usize,
}

impl Scheduler {
    pub fn new(
        config: SchedulerConfig,
        telemetry_engine: Arc<GpuTelemetryEngine>,
        worker_supervisor: Arc<WorkerSupervisor>,
    ) -> Self {
        Self {
            config,
            telemetry_engine,
            worker_supervisor,
            decision_history: Arc::new(RwLock::new(VecDeque::with_capacity(256))),
            round_robin_counter: AtomicUsize::new(0),
            max_history_size: 256,
        }
    }

    pub fn select_worker(
        &self,
        request_id: &str,
        req: &ChatCompletionRequest,
        policy: SchedulerPolicy,
    ) -> Result<SchedulingDecision> {
        let workers = self.worker_supervisor.list_workers();
        if workers.is_empty() {
            return Err(MardukError::NoEligibleWorker(
                "No registered workers in MARDUK cluster".to_string(),
            ));
        }

        match policy {
            SchedulerPolicy::RoundRobinBaseline => {
                self.select_round_robin(request_id, req, &workers)
            }
            SchedulerPolicy::DeterministicMultiFactor | SchedulerPolicy::LearnedCost => {
                self.select_deterministic(request_id, req, &workers)
            }
        }
    }

    fn select_round_robin(
        &self,
        request_id: &str,
        req: &ChatCompletionRequest,
        workers: &[WorkerInfo],
    ) -> Result<SchedulingDecision> {
        let healthy: Vec<&WorkerInfo> = workers
            .iter()
            .filter(|w| w.status == WorkerStatus::Healthy || w.status == WorkerStatus::Busy)
            .collect();

        if healthy.is_empty() {
            return Err(MardukError::NoEligibleWorker(
                "All workers are unhealthy or stopped".to_string(),
            ));
        }

        let idx = self.round_robin_counter.fetch_add(1, Ordering::Relaxed) % healthy.len();
        let selected = healthy[idx];

        let decision = SchedulingDecision {
            decision_id: format!("dec-{}", uuid::Uuid::new_v4().simple()),
            request_id: request_id.to_string(),
            model: req.model.clone(),
            timestamp: Utc::now(),
            selected_worker_id: selected.id.clone(),
            assigned_device_id: selected.assigned_device_id,
            rationale: format!(
                "Baseline Round-Robin selection (worker index {} of {})",
                idx,
                healthy.len()
            ),
            candidates_evaluated: vec![],
            disqualified: vec![],
            learned_prediction_used: false,
        };

        self.record_decision(decision.clone());
        Ok(decision)
    }

    fn select_deterministic(
        &self,
        request_id: &str,
        req: &ChatCompletionRequest,
        workers: &[WorkerInfo],
    ) -> Result<SchedulingDecision> {
        let mut candidates = Vec::new();
        let mut disqualified = Vec::new();

        let prompt_tokens = req.estimate_prompt_tokens();
        let target_tokens = req.target_max_tokens();

        for worker in workers {
            // Hard constraint 1: Health check
            if worker.status != WorkerStatus::Healthy && worker.status != WorkerStatus::Busy {
                disqualified.push(DisqualificationRecord {
                    worker_id: worker.id.clone(),
                    reason: format!("Worker status is '{}' (not healthy)", worker.status),
                });
                continue;
            }

            // Hard constraint 2: Queue capacity (Admission control)
            if worker.current_queue_depth >= self.config.max_queue_per_worker {
                disqualified.push(DisqualificationRecord {
                    worker_id: worker.id.clone(),
                    reason: format!(
                        "Worker queue saturated (depth: {} >= max: {})",
                        worker.current_queue_depth, self.config.max_queue_per_worker
                    ),
                });
                continue;
            }

            // Hard constraint 3: Model support
            let model_match = worker
                .loaded_model
                .as_ref()
                .map(|m| m == &req.model)
                .unwrap_or(false);

            if !model_match && !worker.supported_models.contains(&req.model) {
                disqualified.push(DisqualificationRecord {
                    worker_id: worker.id.clone(),
                    reason: format!(
                        "Requested model '{}' neither loaded nor in supported models list",
                        req.model
                    ),
                });
                continue;
            }

            // Hard constraint 4: VRAM Headroom check
            let gpu_metrics = self
                .telemetry_engine
                .device_metrics(worker.assigned_device_id);

            let (_free_vram_mb, memory_pressure) = match gpu_metrics {
                Ok(m) => {
                    let free_mb = m.memory_free_mb();
                    let pressure = m.memory_pressure_ratio();
                    // If less than minimum required headroom, disqualify
                    if free_mb < self.config.weight_vram * 100.0 && !model_match {
                        disqualified.push(DisqualificationRecord {
                            worker_id: worker.id.clone(),
                            reason: format!(
                                "Insufficient VRAM headroom on GPU {}: {:.1} MB available",
                                worker.assigned_device_id, free_mb
                            ),
                        });
                        continue;
                    }
                    (free_mb, pressure)
                }
                Err(_) => (1024.0, 0.5), // Fallback when telemetry unassigned
            };

            // Multi-factor cost scoring
            let avg_service_time = if worker.average_latency_ms > 0.0 {
                worker.average_latency_ms
            } else {
                50.0
            };

            // Estimated wait time = queue depth * average latency
            let est_wait_ms = worker.current_queue_depth as f64 * avg_service_time;

            // Estimated execution time = prefill + decode
            let est_exec_ms = 15.0 + (prompt_tokens as f64 * 0.1) + (target_tokens as f64 * 4.0);

            // Cost calculation: lower cost is better
            // Cost = w_queue * wait_time + w_compute * exec_time + w_vram * (pressure ^ 2) - affinity_bonus
            let mut score = (self.config.weight_queue * est_wait_ms)
                + (self.config.weight_compute * est_exec_ms)
                + (self.config.weight_vram * (memory_pressure.powi(2) * 100.0));

            if model_match {
                score -= self.config.affinity_bonus * 50.0; // Significant bonus for avoiding model reload
            }

            candidates.push(CandidateEvaluation {
                worker_id: worker.id.clone(),
                device_id: worker.assigned_device_id,
                queue_depth: worker.current_queue_depth,
                estimated_wait_ms: est_wait_ms,
                estimated_exec_ms: est_exec_ms,
                memory_pressure,
                has_model_affinity: model_match,
                final_score: score,
            });
        }

        if candidates.is_empty() {
            let reason_summary = disqualified
                .iter()
                .map(|d| format!("{}: {}", d.worker_id, d.reason))
                .collect::<Vec<_>>()
                .join("; ");
            warn!(
                "Admission rejected for request '{}': All candidates disqualified ({})",
                request_id, reason_summary
            );
            return Err(MardukError::NoEligibleWorker(format!(
                "No eligible worker passed constraints: {}",
                reason_summary
            )));
        }

        // Sort candidates by lowest score (lowest cost)
        candidates.sort_by(|a, b| {
            a.final_score
                .partial_cmp(&b.final_score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        let best = &candidates[0];
        let rationale = format!(
            "Selected worker '{}' on GPU {}: lowest cost score {:.2} (queue wait: {:.1}ms, depth: {}, memory pressure: {:.1}%, model affinity: {})",
            best.worker_id,
            best.device_id,
            best.final_score,
            best.estimated_wait_ms,
            best.queue_depth,
            best.memory_pressure * 100.0,
            best.has_model_affinity
        );

        info!("Routing request '{}': {}", request_id, rationale);

        let decision = SchedulingDecision {
            decision_id: format!("dec-{}", uuid::Uuid::new_v4().simple()),
            request_id: request_id.to_string(),
            model: req.model.clone(),
            timestamp: Utc::now(),
            selected_worker_id: best.worker_id.clone(),
            assigned_device_id: best.device_id,
            rationale,
            candidates_evaluated: candidates,
            disqualified,
            learned_prediction_used: false,
        };

        self.record_decision(decision.clone());
        Ok(decision)
    }

    fn record_decision(&self, decision: SchedulingDecision) {
        let mut history = self.decision_history.write();
        if history.len() >= self.max_history_size {
            history.pop_back();
        }
        history.push_front(decision);
    }

    pub fn recent_decisions(&self, limit: usize) -> Vec<SchedulingDecision> {
        let history = self.decision_history.read();
        history.iter().take(limit).cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use marduk_core::models::ChatMessage;
    use marduk_core::worker::WorkerId;

    #[test]
    fn test_scheduler_deterministic_scoring() {
        let telemetry = Arc::new(GpuTelemetryEngine::new(false));
        let supervisor = Arc::new(WorkerSupervisor::new(telemetry.clone(), 10));

        supervisor
            .spawn_local_worker(
                WorkerId::from("worker-fast"),
                "worker-fast".to_string(),
                0,
                Some("gpt-neox".to_string()),
                vec!["gpt-neox".to_string()],
            )
            .unwrap();

        supervisor
            .spawn_local_worker(
                WorkerId::from("worker-slow"),
                "worker-slow".to_string(),
                0,
                Some("gpt-neox".to_string()),
                vec!["gpt-neox".to_string()],
            )
            .unwrap();

        let scheduler = Scheduler::new(SchedulerConfig::default(), telemetry, supervisor);
        let req = ChatCompletionRequest {
            model: "gpt-neox".to_string(),
            messages: vec![ChatMessage {
                role: "user".to_string(),
                content: "Benchmark prompt".to_string(),
                name: None,
            }],
            temperature: None,
            top_p: None,
            max_tokens: Some(32),
            stream: false,
            stop: None,
            priority: None,
        };

        let decision = scheduler
            .select_worker("req-1", &req, SchedulerPolicy::DeterministicMultiFactor)
            .expect("Worker selection failed");

        assert_eq!(decision.candidates_evaluated.len(), 2);
        assert!(!decision.rationale.is_empty());
    }
}
