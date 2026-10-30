pub mod backend;
pub mod supervisor;

pub use backend::{InferenceBackend, LocalEngineWorker, TokenStream};
pub use supervisor::{ManagedWorker, WorkerSupervisor};

#[cfg(test)]
mod tests {
    use super::*;
    use marduk_core::models::{ChatCompletionRequest, ChatMessage};
    use marduk_core::worker::WorkerId;
    use marduk_nvml::GpuTelemetryEngine;
    use std::sync::Arc;

    #[tokio::test]
    async fn test_worker_registration_and_dispatch() {
        let telemetry = Arc::new(GpuTelemetryEngine::new(false));
        let supervisor = WorkerSupervisor::new(telemetry, 16);

        let worker_id = WorkerId::from("worker-01");
        supervisor
            .spawn_local_worker(
                worker_id.clone(),
                "test-worker".to_string(),
                0,
                Some("llama-3-8b".to_string()),
                vec!["llama-3-8b".to_string()],
            )
            .expect("Failed to spawn worker");

        let workers = supervisor.list_workers();
        assert_eq!(workers.len(), 1);
        assert_eq!(workers[0].loaded_model.as_deref(), Some("llama-3-8b"));

        let req = ChatCompletionRequest {
            model: "llama-3-8b".to_string(),
            messages: vec![ChatMessage {
                role: "user".to_string(),
                content: "Hello MARDUK".to_string(),
                name: None,
            }],
            temperature: None,
            top_p: None,
            max_tokens: Some(16),
            stream: false,
            stop: None,
            priority: None,
        };

        let resp = supervisor
            .dispatch(&worker_id, req)
            .await
            .expect("Inference failed");
        assert!(!resp.choices.is_empty());
        assert!(resp.choices[0].message.content.contains("MARDUK"));
    }
}
