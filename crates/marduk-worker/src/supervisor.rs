use crate::backend::{InferenceBackend, LocalEngineWorker, TokenStream};
use chrono::Utc;
use marduk_core::error::{MardukError, Result};
use marduk_core::models::{ChatCompletionRequest, ChatCompletionResponse};
use marduk_core::worker::{WorkerHeartbeat, WorkerId, WorkerInfo, WorkerStatus};
use marduk_nvml::GpuTelemetryEngine;
use parking_lot::RwLock;
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Instant;
use tracing::{error, info, warn};

pub struct ManagedWorker {
    pub info: RwLock<WorkerInfo>,
    pub backend: Arc<dyn InferenceBackend>,
    pub active_queue: Arc<AtomicUsize>,
    pub total_processed: Arc<AtomicU64>,
    pub total_tokens: Arc<AtomicU64>,
    pub cumulative_latency_ms: Arc<AtomicU64>,
}

pub struct WorkerSupervisor {
    workers: Arc<RwLock<HashMap<WorkerId, Arc<ManagedWorker>>>>,
    telemetry_engine: Arc<GpuTelemetryEngine>,
    max_queue_per_worker: usize,
}

impl WorkerSupervisor {
    pub fn new(telemetry_engine: Arc<GpuTelemetryEngine>, max_queue_per_worker: usize) -> Self {
        Self {
            workers: Arc::new(RwLock::new(HashMap::new())),
            telemetry_engine,
            max_queue_per_worker,
        }
    }

    pub fn register_worker(
        &self,
        worker_id: WorkerId,
        name: String,
        device_id: u32,
        initial_model: Option<String>,
        supported_models: Vec<String>,
        backend: Arc<dyn InferenceBackend>,
    ) -> Result<()> {
        let mut map = self.workers.write();
        if map.contains_key(&worker_id) {
            return Err(MardukError::Worker {
                worker_id: worker_id.0,
                message: "Worker already registered".to_string(),
            });
        }

        let info = WorkerInfo {
            id: worker_id.clone(),
            name,
            status: WorkerStatus::Healthy,
            assigned_device_id: device_id,
            loaded_model: initial_model,
            supported_models,
            current_queue_depth: 0,
            max_queue_capacity: self.max_queue_per_worker,
            active_requests: 0,
            total_requests_processed: 0,
            total_tokens_generated: 0,
            average_latency_ms: 0.0,
            last_heartbeat: Utc::now(),
            started_at: Utc::now(),
        };

        let managed = Arc::new(ManagedWorker {
            info: RwLock::new(info),
            backend,
            active_queue: Arc::new(AtomicUsize::new(0)),
            total_processed: Arc::new(AtomicU64::new(0)),
            total_tokens: Arc::new(AtomicU64::new(0)),
            cumulative_latency_ms: Arc::new(AtomicU64::new(0)),
        });

        self.telemetry_engine
            .assign_worker_to_device(device_id, worker_id.0.clone());
        map.insert(worker_id.clone(), managed);
        info!(
            "Registered worker '{}' on GPU device {}",
            worker_id, device_id
        );

        Ok(())
    }

    pub fn spawn_local_worker(
        &self,
        worker_id: WorkerId,
        name: String,
        device_id: u32,
        model: Option<String>,
        supported_models: Vec<String>,
    ) -> Result<()> {
        let backend = Arc::new(LocalEngineWorker::new(model.clone(), device_id));
        self.register_worker(worker_id, name, device_id, model, supported_models, backend)
    }

    pub fn unregister_worker(&self, worker_id: &WorkerId) -> Result<()> {
        let mut map = self.workers.write();
        if let Some(worker) = map.remove(worker_id) {
            let dev_id = worker.info.read().assigned_device_id;
            self.telemetry_engine
                .remove_worker_from_device(dev_id, &worker_id.0);
            info!("Unregistered worker '{}'", worker_id);
            Ok(())
        } else {
            Err(MardukError::Worker {
                worker_id: worker_id.0.clone(),
                message: "Worker not found".to_string(),
            })
        }
    }

    pub fn list_workers(&self) -> Vec<WorkerInfo> {
        let map = self.workers.read();
        map.values()
            .map(|w| {
                let mut info = w.info.read().clone();
                info.current_queue_depth = w.active_queue.load(Ordering::Relaxed);
                info.active_requests = info.current_queue_depth;
                let count = w.total_processed.load(Ordering::Relaxed);
                info.total_requests_processed = count;
                info.total_tokens_generated = w.total_tokens.load(Ordering::Relaxed);
                if count > 0 {
                    info.average_latency_ms =
                        w.cumulative_latency_ms.load(Ordering::Relaxed) as f64 / count as f64;
                }
                info
            })
            .collect()
    }

    pub fn get_worker(&self, worker_id: &WorkerId) -> Result<Arc<ManagedWorker>> {
        let map = self.workers.read();
        map.get(worker_id)
            .cloned()
            .ok_or_else(|| MardukError::Worker {
                worker_id: worker_id.0.clone(),
                message: "Worker not found".to_string(),
            })
    }

    pub async fn dispatch(
        &self,
        worker_id: &WorkerId,
        req: ChatCompletionRequest,
    ) -> Result<ChatCompletionResponse> {
        let worker = self.get_worker(worker_id)?;

        // Enforce worker queue limit
        let current_depth = worker.active_queue.fetch_add(1, Ordering::SeqCst);
        if current_depth >= self.max_queue_per_worker {
            worker.active_queue.fetch_sub(1, Ordering::SeqCst);
            return Err(MardukError::QueueFull(format!(
                "Worker '{}' queue capacity {} exceeded (current: {})",
                worker_id, self.max_queue_per_worker, current_depth
            )));
        }

        let start = Instant::now();
        let result = worker.backend.generate(req).await;
        let duration_ms = start.elapsed().as_millis() as u64;

        worker.active_queue.fetch_sub(1, Ordering::SeqCst);

        match result {
            Ok(mut resp) => {
                worker.total_processed.fetch_add(1, Ordering::Relaxed);
                worker
                    .total_tokens
                    .fetch_add(resp.usage.total_tokens as u64, Ordering::Relaxed);
                worker
                    .cumulative_latency_ms
                    .fetch_add(duration_ms, Ordering::Relaxed);

                let dev_id = worker.info.read().assigned_device_id;
                resp.routing_metadata = Some(marduk_core::models::RoutingMetadata {
                    selected_worker_id: worker_id.0.clone(),
                    device_id: dev_id,
                    queue_wait_ms: 0,
                    inference_duration_ms: duration_ms,
                    routing_reason: "Optimally routed via MARDUK intelligent scheduler".to_string(),
                });

                Ok(resp)
            }
            Err(e) => {
                error!("Worker '{}' inference failed: {}", worker_id, e);
                Err(e)
            }
        }
    }

    pub async fn dispatch_stream(
        &self,
        worker_id: &WorkerId,
        req: ChatCompletionRequest,
    ) -> Result<TokenStream> {
        let worker = self.get_worker(worker_id)?;

        let current_depth = worker.active_queue.fetch_add(1, Ordering::SeqCst);
        if current_depth >= self.max_queue_per_worker {
            worker.active_queue.fetch_sub(1, Ordering::SeqCst);
            return Err(MardukError::QueueFull(format!(
                "Worker '{}' queue capacity {} exceeded",
                worker_id, self.max_queue_per_worker
            )));
        }

        let stream_res = worker.backend.generate_stream(req).await;
        // Decrement queue after dispatch initiation
        worker.active_queue.fetch_sub(1, Ordering::SeqCst);
        worker.total_processed.fetch_add(1, Ordering::Relaxed);

        stream_res
    }

    pub async fn record_heartbeat(&self, hb: WorkerHeartbeat) -> Result<()> {
        let map = self.workers.read();
        if let Some(worker) = map.get(&hb.worker_id) {
            let mut info = worker.info.write();
            info.status = hb.status;
            info.last_heartbeat = hb.timestamp;
            if hb.loaded_model.is_some() {
                info.loaded_model = hb.loaded_model;
            }
            Ok(())
        } else {
            Err(MardukError::Worker {
                worker_id: hb.worker_id.0,
                message: "Heartbeat from unknown worker".to_string(),
            })
        }
    }

    pub fn start_health_monitor(
        self: Arc<Self>,
        timeout_ms: u64,
        check_interval: std::time::Duration,
    ) -> tokio::task::JoinHandle<()> {
        tokio::spawn(async move {
            let mut ticker = tokio::time::interval(check_interval);
            loop {
                ticker.tick().await;
                let now = Utc::now();
                let workers = self.workers.read().clone();
                for (id, worker) in workers {
                    let mut info = worker.info.write();
                    let elapsed = (now - info.last_heartbeat).num_milliseconds();
                    if elapsed > timeout_ms as i64 && info.status != WorkerStatus::Stopped {
                        warn!(
                            "Worker '{}' missed heartbeat (elapsed: {}ms > {}ms). Setting to Degraded.",
                            id, elapsed, timeout_ms
                        );
                        info.status = WorkerStatus::Degraded;
                    }
                }
            }
        })
    }
}
