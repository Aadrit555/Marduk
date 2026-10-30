pub mod config;
pub mod error;
pub mod models;
pub mod scheduler;
pub mod telemetry;
pub mod worker;

pub use config::MardukConfig;
pub use error::{MardukError, Result};
pub use models::*;
pub use scheduler::*;
pub use telemetry::*;
pub use worker::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = MardukConfig::default();
        assert_eq!(config.server.port, 8080);
        assert_eq!(config.gpu.min_vram_headroom_mb, 512);
        assert_eq!(config.scheduler.max_queue_per_worker, 64);
    }

    #[test]
    fn test_prompt_token_estimation() {
        let req = ChatCompletionRequest {
            model: "test-model".to_string(),
            messages: vec![ChatMessage {
                role: "user".to_string(),
                content: "Hello world, how are you doing today?".to_string(),
                name: None,
            }],
            temperature: None,
            top_p: None,
            max_tokens: Some(128),
            stream: false,
            stop: None,
            priority: None,
        };
        let estimated = req.estimate_prompt_tokens();
        assert!(estimated >= 5);
        assert_eq!(req.target_max_tokens(), 128);
    }
}
