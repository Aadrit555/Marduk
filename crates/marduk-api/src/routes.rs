use crate::state::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::response::{IntoResponse, Response};
use axum::Json;
use futures::StreamExt;
use marduk_core::error::MardukError;
use marduk_core::models::{ChatCompletionRequest, ModelInfo};
use marduk_core::scheduler::SchedulerPolicy;
use marduk_core::worker::WorkerId;
use marduk_learned::ExecutionTrace;
use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use std::time::Instant;
use tracing::info;

#[derive(Serialize)]
pub struct HealthStatus {
    pub status: &'static str,
    pub product: &'static str,
    pub version: &'static str,
    pub nvml_available: bool,
    pub active_workers: usize,
}

#[derive(Serialize)]
pub struct OpenAiModelEntry {
    pub id: String,
    pub object: &'static str,
    pub created: i64,
    pub owned_by: &'static str,
}

#[derive(Serialize)]
pub struct OpenAiModelsList {
    pub object: &'static str,
    pub data: Vec<OpenAiModelEntry>,
}

#[derive(Deserialize)]
pub struct SpawnWorkerPayload {
    pub id: String,
    pub name: String,
    pub device_id: u32,
    pub model: Option<String>,
    pub supported_models: Vec<String>,
}

pub async fn health_handler(State(state): State<AppState>) -> Json<HealthStatus> {
    let workers = state.worker_supervisor.list_workers();
    Json(HealthStatus {
        status: "ok",
        product: "MARDUK",
        version: "0.1.0",
        nvml_available: state.telemetry_engine.is_nvml_available(),
        active_workers: workers.len(),
    })
}

pub async fn ready_handler(State(state): State<AppState>) -> (StatusCode, &'static str) {
    let workers = state.worker_supervisor.list_workers();
    if workers.is_empty() {
        (StatusCode::SERVICE_UNAVAILABLE, "No workers active")
    } else {
        (StatusCode::OK, "Ready")
    }
}

pub async fn prometheus_metrics_handler(State(state): State<AppState>) -> String {
    let snap = state.metrics_tracker.snapshot();
    let workers = state.worker_supervisor.list_workers();
    let gpus = state.telemetry_engine.current_metrics();

    let mut output = String::new();
    output.push_str("# HELP marduk_requests_total Total completed inference requests\n");
    output.push_str("# TYPE marduk_requests_total counter\n");
    output.push_str(&format!("marduk_requests_total {}\n", snap.total_requests));

    output.push_str("# HELP marduk_tokens_total Total tokens generated\n");
    output.push_str("# TYPE marduk_tokens_total counter\n");
    output.push_str(&format!(
        "marduk_tokens_total {}\n",
        snap.total_tokens_generated
    ));

    output.push_str("# HELP marduk_active_workers Number of active inference workers\n");
    output.push_str("# TYPE marduk_active_workers gauge\n");
    output.push_str(&format!("marduk_active_workers {}\n", workers.len()));

    for gpu in gpus {
        output.push_str(&format!(
            "marduk_gpu_memory_used_bytes{{device=\"{}\"}} {}\n",
            gpu.device_id, gpu.memory_used_bytes
        ));
        output.push_str(&format!(
            "marduk_gpu_memory_total_bytes{{device=\"{}\"}} {}\n",
            gpu.device_id, gpu.memory_total_bytes
        ));
        if let Some(util) = gpu.gpu_utilization_percent {
            output.push_str(&format!(
                "marduk_gpu_utilization_ratio{{device=\"{}\"}} {:.2}\n",
                gpu.device_id,
                util as f64 / 100.0
            ));
        }
        if let Some(temp) = gpu.temperature_celsius {
            output.push_str(&format!(
                "marduk_gpu_temperature_celsius{{device=\"{}\"}} {}\n",
                gpu.device_id, temp
            ));
        }
    }

    output
}

pub async fn get_gpus_handler(State(state): State<AppState>) -> Response {
    let telemetry = state.telemetry_engine.system_telemetry();
    Json(telemetry).into_response()
}

pub async fn get_workers_handler(State(state): State<AppState>) -> Response {
    let workers = state.worker_supervisor.list_workers();
    Json(workers).into_response()
}

pub async fn spawn_worker_handler(
    State(state): State<AppState>,
    Json(payload): Json<SpawnWorkerPayload>,
) -> Response {
    let worker_id = WorkerId::from(payload.id);
    match state.worker_supervisor.spawn_local_worker(
        worker_id,
        payload.name,
        payload.device_id,
        payload.model,
        payload.supported_models,
    ) {
        Ok(_) => (
            StatusCode::CREATED,
            Json(serde_json::json!({"status": "created"})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

pub async fn delete_worker_handler(
    State(state): State<AppState>,
    Path(worker_id): Path<String>,
) -> Response {
    let id = WorkerId::from(worker_id);
    match state.worker_supervisor.unregister_worker(&id) {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

pub async fn get_models_handler(State(state): State<AppState>) -> Response {
    let models = state.model_registry.read().clone();
    Json(models).into_response()
}

pub async fn register_model_handler(
    State(state): State<AppState>,
    Json(model): Json<ModelInfo>,
) -> Response {
    state.model_registry.write().push(model);
    (
        StatusCode::CREATED,
        Json(serde_json::json!({"status": "registered"})),
    )
        .into_response()
}

pub async fn get_scheduler_decisions_handler(State(state): State<AppState>) -> Response {
    let decisions = state.scheduler.recent_decisions(50);
    Json(decisions).into_response()
}

pub async fn get_metrics_handler(State(state): State<AppState>) -> Response {
    let snap = state.metrics_tracker.snapshot();
    Json(snap).into_response()
}

pub async fn get_benchmarks_handler(State(state): State<AppState>) -> Response {
    let list = state.benchmark_results.read().clone();
    Json(list).into_response()
}

pub async fn run_benchmark_handler(
    State(state): State<AppState>,
    Json(payload): Json<Option<marduk_bench::BenchmarkConfig>>,
) -> Response {
    let config = payload.unwrap_or_default();
    let harness = marduk_bench::BenchmarkHarness::new();

    let multifactor = harness
        .run_benchmark(
            &config,
            SchedulerPolicy::DeterministicMultiFactor,
            "Deterministic Multi-Factor",
        )
        .await;

    let baseline = harness
        .run_benchmark(
            &config,
            SchedulerPolicy::RoundRobinBaseline,
            "Round-Robin Baseline",
        )
        .await;

    {
        let mut history = state.benchmark_results.write();
        history.push(multifactor.clone());
        history.push(baseline.clone());
        if history.len() > 50 {
            let excess = history.len() - 50;
            history.drain(0..excess);
        }
    }

    Json(serde_json::json!({
        "status": "success",
        "multifactor": multifactor,
        "baseline": baseline,
    }))
    .into_response()
}

// Dedicated GPU Benchmark Subsystem Endpoints
pub async fn get_benchmark_capabilities_handler(State(state): State<AppState>) -> Response {
    let caps = state.benchmark_engine.get_capabilities();
    Json(caps).into_response()
}

pub async fn get_system_hardware_handler(State(state): State<AppState>) -> Response {
    let summary = state.benchmark_engine.get_system_hardware();
    Json(summary).into_response()
}

pub async fn get_system_rating_handler(State(state): State<AppState>) -> Response {
    let rating = state.benchmark_engine.get_system_rating();
    Json(rating).into_response()
}

pub async fn export_benchmark_results_handler(
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Response {
    let format = params.get("format").map(|s| s.as_str()).unwrap_or("json");
    match state.benchmark_engine.export_results(format) {
        Ok(content) => {
            let content_type = if format == "csv" { "text/csv" } else { "application/json" };
            (
                [(axum::http::header::CONTENT_TYPE, content_type)],
                content,
            )
                .into_response()
        }
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err })),
        )
            .into_response(),
    }
}

pub async fn get_benchmark_history_handler(State(state): State<AppState>) -> Response {
    let history = state.benchmark_engine.get_history();
    Json(history).into_response()
}

pub async fn get_benchmark_job_handler(
    State(state): State<AppState>,
    Path(run_id): Path<String>,
) -> Response {
    if let Some(job) = state.benchmark_engine.get_job(&run_id) {
        Json(job).into_response()
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({
                "error": format!("Benchmark job with ID '{}' not found", run_id)
            })),
        )
            .into_response()
    }
}

pub async fn run_benchmark_job_handler(
    State(state): State<AppState>,
    Json(payload): Json<marduk_bench::RunBenchmarkRequest>,
) -> Response {
    match state.benchmark_engine.submit_job(payload).await {
        Ok(run_id) => (
            StatusCode::ACCEPTED,
            Json(serde_json::json!({
                "status": "submitted",
                "run_id": run_id,
                "message": "Benchmark job submitted and undergoing preflight checks"
            })),
        )
            .into_response(),
        Err(err) => (
            StatusCode::CONFLICT,
            Json(serde_json::json!({
                "status": "rejected",
                "error": err
            })),
        )
            .into_response(),
    }
}

pub async fn cancel_benchmark_job_handler(
    State(state): State<AppState>,
    Path(run_id): Path<String>,
) -> Response {
    match state.benchmark_engine.cancel_job(&run_id) {
        Ok(_) => Json(serde_json::json!({
            "status": "cancelled",
            "run_id": run_id,
            "message": "Cancellation signal dispatched"
        }))
        .into_response(),
        Err(err) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({
                "status": "error",
                "error": err
            })),
        )
            .into_response(),
    }
}

// OpenAI API compatibility: GET /v1/models
pub async fn openai_list_models_handler(State(state): State<AppState>) -> Response {
    let registered = state.model_registry.read();
    let data = registered
        .iter()
        .map(|m| OpenAiModelEntry {
            id: m.id.clone(),
            object: "model",
            created: m.created_at.timestamp(),
            owned_by: "marduk",
        })
        .collect();

    Json(OpenAiModelsList {
        object: "list",
        data,
    })
    .into_response()
}

// OpenAI API compatibility: POST /v1/chat/completions
pub async fn openai_chat_completions_handler(
    State(state): State<AppState>,
    Json(req): Json<ChatCompletionRequest>,
) -> Response {
    let request_id = format!("req-{}", uuid::Uuid::new_v4().simple());
    info!(
        "Received chat completion request [{}] for model '{}' (stream={})",
        request_id, req.model, req.stream
    );

    let start = Instant::now();
    let prompt_tokens = req.estimate_prompt_tokens();
    let target_tokens = req.target_max_tokens();

    // Route request through intelligent scheduler
    let decision = match state.scheduler.select_worker(
        &request_id,
        &req,
        SchedulerPolicy::DeterministicMultiFactor,
    ) {
        Ok(d) => d,
        Err(MardukError::NoEligibleWorker(reason)) => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(serde_json::json!({
                    "error": {
                        "message": reason,
                        "type": "marduk_capacity_error",
                        "code": 503
                    }
                })),
            )
                .into_response();
        }
        Err(MardukError::QueueFull(reason)) => {
            return (
                StatusCode::TOO_MANY_REQUESTS,
                Json(serde_json::json!({
                    "error": {
                        "message": reason,
                        "type": "marduk_backpressure_error",
                        "code": 429
                    }
                })),
            )
                .into_response();
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": {
                        "message": e.to_string(),
                        "type": "internal_error",
                        "code": 500
                    }
                })),
            )
                .into_response();
        }
    };

    let worker_id = decision.selected_worker_id;

    if req.stream {
        // SSE streaming response
        match state
            .worker_supervisor
            .dispatch_stream(&worker_id, req)
            .await
        {
            Ok(stream) => {
                let sse_stream = stream.map(|chunk_res| match chunk_res {
                    Ok(chunk) => {
                        let json = serde_json::to_string(&chunk).unwrap_or_default();
                        Ok::<Event, Infallible>(Event::default().data(json))
                    }
                    Err(e) => {
                        let err_json = serde_json::json!({ "error": e.to_string() }).to_string();
                        Ok::<Event, Infallible>(Event::default().data(err_json))
                    }
                });

                Sse::new(sse_stream)
                    .keep_alive(KeepAlive::new())
                    .into_response()
            }
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        }
    } else {
        // Non-streaming response
        match state.worker_supervisor.dispatch(&worker_id, req).await {
            Ok(resp) => {
                let total_ms = start.elapsed().as_millis() as f64;
                state
                    .metrics_tracker
                    .record_completion(resp.usage.total_tokens as u64, total_ms as u64);

                // Record execution trace for Burn learned predictor
                state.learned_engine.record_trace(ExecutionTrace {
                    trace_id: request_id,
                    timestamp: chrono::Utc::now(),
                    model: resp.model.clone(),
                    device_id: decision.assigned_device_id,
                    prompt_tokens: prompt_tokens as f64,
                    target_tokens: target_tokens as f64,
                    queue_depth: 0.0,
                    memory_pressure: 0.5,
                    measured_ttft_ms: 15.0,
                    measured_total_latency_ms: total_ms,
                    measured_peak_vram_mb: 256.0,
                });

                Json(resp).into_response()
            }
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        }
    }
}
