pub mod routes;
pub mod state;

use axum::routing::{delete, get, post};
use axum::Router;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::info;

pub use state::AppState;

pub fn build_app(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let router = Router::new()
        // Operational endpoints
        .route("/health", get(routes::health_handler))
        .route("/ready", get(routes::ready_handler))
        .route("/metrics", get(routes::prometheus_metrics_handler))
        .route("/api/v1/health", get(routes::health_handler))
        .route("/api/v1/gpus", get(routes::get_gpus_handler))
        .route(
            "/api/v1/workers",
            get(routes::get_workers_handler).post(routes::spawn_worker_handler),
        )
        .route("/api/v1/workers/:id", delete(routes::delete_worker_handler))
        .route(
            "/api/v1/models",
            get(routes::get_models_handler).post(routes::register_model_handler),
        )
        .route(
            "/api/v1/scheduler/decisions",
            get(routes::get_scheduler_decisions_handler),
        )
        .route("/api/v1/metrics", get(routes::get_metrics_handler))
        // OpenAI-compatible endpoints
        .route("/v1/models", get(routes::openai_list_models_handler))
        .route(
            "/v1/chat/completions",
            post(routes::openai_chat_completions_handler),
        );

    let router = if std::path::Path::new("dashboard/dist").exists() {
        router.fallback_service(
            tower_http::services::ServeDir::new("dashboard/dist").fallback(
                tower_http::services::ServeFile::new("dashboard/dist/index.html"),
            ),
        )
    } else {
        router
    };

    router
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state)
}

pub async fn run_server(addr: SocketAddr, state: AppState) -> Result<(), std::io::Error> {
    let app = build_app(state);
    info!("MARDUK Control & Data Plane listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use marduk_core::config::SchedulerConfig;
    use marduk_learned::LearnedSchedulerEngine;
    use marduk_nvml::GpuTelemetryEngine;
    use marduk_scheduler::Scheduler;
    use marduk_worker::WorkerSupervisor;
    use std::sync::Arc;
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_health_and_models_endpoints() {
        let telemetry = Arc::new(GpuTelemetryEngine::new(false));
        let supervisor = Arc::new(WorkerSupervisor::new(telemetry.clone(), 16));
        let scheduler = Arc::new(Scheduler::new(
            SchedulerConfig::default(),
            telemetry.clone(),
            supervisor.clone(),
        ));
        let learned = Arc::new(LearnedSchedulerEngine::new());
        let state = AppState::new(telemetry, supervisor, scheduler, learned);

        let app = build_app(state);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let models_resp = app
            .oneshot(
                Request::builder()
                    .uri("/v1/models")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(models_resp.status(), StatusCode::OK);
    }
}
