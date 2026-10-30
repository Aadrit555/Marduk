use chrono::Utc;
use marduk_core::models::ModelInfo;
use marduk_learned::LearnedSchedulerEngine;
use marduk_nvml::GpuTelemetryEngine;
use marduk_scheduler::Scheduler;
use marduk_worker::WorkerSupervisor;
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct MetricsSnapshot {
    pub total_requests: u64,
    pub total_tokens_generated: u64,
    pub active_requests: u64,
    pub average_latency_ms: f64,
    pub requests_per_second: f64,
    pub tokens_per_second: f64,
}

pub struct MetricsTracker {
    pub total_requests: AtomicU64,
    pub total_tokens: AtomicU64,
    pub cumulative_latency_ms: AtomicU64,
    pub active_requests: AtomicU64,
    pub start_time: std::time::Instant,
}

impl MetricsTracker {
    pub fn new() -> Self {
        Self {
            total_requests: AtomicU64::new(0),
            total_tokens: AtomicU64::new(0),
            cumulative_latency_ms: AtomicU64::new(0),
            active_requests: AtomicU64::new(0),
            start_time: std::time::Instant::now(),
        }
    }

    pub fn record_completion(&self, tokens: u64, latency_ms: u64) {
        self.total_requests.fetch_add(1, Ordering::Relaxed);
        self.total_tokens.fetch_add(tokens, Ordering::Relaxed);
        self.cumulative_latency_ms
            .fetch_add(latency_ms, Ordering::Relaxed);
    }

    pub fn snapshot(&self) -> MetricsSnapshot {
        let reqs = self.total_requests.load(Ordering::Relaxed);
        let tokens = self.total_tokens.load(Ordering::Relaxed);
        let lat = self.cumulative_latency_ms.load(Ordering::Relaxed);
        let elapsed_secs = self.start_time.elapsed().as_secs_f64().max(0.001);

        MetricsSnapshot {
            total_requests: reqs,
            total_tokens_generated: tokens,
            active_requests: self.active_requests.load(Ordering::Relaxed),
            average_latency_ms: if reqs > 0 {
                lat as f64 / reqs as f64
            } else {
                0.0
            },
            requests_per_second: reqs as f64 / elapsed_secs,
            tokens_per_second: tokens as f64 / elapsed_secs,
        }
    }
}

impl Default for MetricsTracker {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Clone)]
pub struct AppState {
    pub telemetry_engine: Arc<GpuTelemetryEngine>,
    pub worker_supervisor: Arc<WorkerSupervisor>,
    pub scheduler: Arc<Scheduler>,
    pub learned_engine: Arc<LearnedSchedulerEngine>,
    pub model_registry: Arc<RwLock<Vec<ModelInfo>>>,
    pub metrics_tracker: Arc<MetricsTracker>,
}

impl AppState {
    pub fn new(
        telemetry_engine: Arc<GpuTelemetryEngine>,
        worker_supervisor: Arc<WorkerSupervisor>,
        scheduler: Arc<Scheduler>,
        learned_engine: Arc<LearnedSchedulerEngine>,
    ) -> Self {
        // Register default supported models
        let initial_models = vec![
            ModelInfo {
                id: "mistral-7b-instruct".to_string(),
                name: "Mistral 7B Instruct v0.3".to_string(),
                family: "mistral".to_string(),
                parameter_count_billions: 7.2,
                context_window: 32768,
                default_quantization: "Q4_K_M".to_string(),
                estimated_vram_mb: 4600,
                created_at: Utc::now(),
            },
            ModelInfo {
                id: "llama-3-8b".to_string(),
                name: "Meta Llama 3 8B".to_string(),
                family: "llama".to_string(),
                parameter_count_billions: 8.0,
                context_window: 8192,
                default_quantization: "Q4_K_M".to_string(),
                estimated_vram_mb: 5120,
                created_at: Utc::now(),
            },
            ModelInfo {
                id: "qwen-2.5-coder-7b".to_string(),
                name: "Qwen 2.5 Coder 7B".to_string(),
                family: "qwen".to_string(),
                parameter_count_billions: 7.6,
                context_window: 32768,
                default_quantization: "Q4_K_M".to_string(),
                estimated_vram_mb: 4800,
                created_at: Utc::now(),
            },
        ];

        Self {
            telemetry_engine,
            worker_supervisor,
            scheduler,
            learned_engine,
            model_registry: Arc::new(RwLock::new(initial_models)),
            metrics_tracker: Arc::new(MetricsTracker::new()),
        }
    }
}
