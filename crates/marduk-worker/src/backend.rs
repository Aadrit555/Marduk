use async_trait::async_trait;
use futures::Stream;
use marduk_core::error::{MardukError, Result};
use marduk_core::models::{
    ChatChoice, ChatCompletionChunk, ChatCompletionChunkChoice, ChatCompletionChunkChoiceDelta,
    ChatCompletionRequest, ChatCompletionResponse, ChatMessage, Usage,
};
use marduk_core::worker::WorkerStatus;
use std::pin::Pin;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;
use tracing::debug;

pub type TokenStream = Pin<Box<dyn Stream<Item = Result<ChatCompletionChunk>> + Send>>;

#[async_trait]
pub trait InferenceBackend: Send + Sync {
    async fn load_model(&self, model_id: &str) -> Result<()>;
    async fn unload_model(&self) -> Result<()>;
    async fn generate(&self, req: ChatCompletionRequest) -> Result<ChatCompletionResponse>;
    async fn generate_stream(&self, req: ChatCompletionRequest) -> Result<TokenStream>;
    async fn check_health(&self) -> WorkerStatus;
}

/// Native local inference engine adapter
/// Executes inference with realistic token generation, simulated/measured KV cache overhead,
/// and streaming support.
pub struct LocalEngineWorker {
    loaded_model: parking_lot::RwLock<Option<String>>,
    assigned_device_id: u32,
    active_requests: Arc<AtomicUsize>,
}

impl LocalEngineWorker {
    pub fn new(initial_model: Option<String>, assigned_device_id: u32) -> Self {
        Self {
            loaded_model: parking_lot::RwLock::new(initial_model),
            assigned_device_id,
            active_requests: Arc::new(AtomicUsize::new(0)),
        }
    }
}

#[async_trait]
impl InferenceBackend for LocalEngineWorker {
    async fn load_model(&self, model_id: &str) -> Result<()> {
        debug!(
            "Loading model '{}' into GPU device {}",
            model_id, self.assigned_device_id
        );
        sleep(Duration::from_millis(150)).await;
        *self.loaded_model.write() = Some(model_id.to_string());
        Ok(())
    }

    async fn unload_model(&self) -> Result<()> {
        debug!(
            "Unloading model from GPU device {}",
            self.assigned_device_id
        );
        *self.loaded_model.write() = None;
        Ok(())
    }

    async fn generate(&self, req: ChatCompletionRequest) -> Result<ChatCompletionResponse> {
        let current_model =
            self.loaded_model
                .read()
                .clone()
                .ok_or_else(|| MardukError::Worker {
                    worker_id: format!("local-dev-{}", self.assigned_device_id),
                    message: "No model loaded on worker".to_string(),
                })?;

        if current_model != req.model {
            return Err(MardukError::ModelNotFound(format!(
                "Worker loaded with '{}', requested '{}'",
                current_model, req.model
            )));
        }

        self.active_requests.fetch_add(1, Ordering::SeqCst);
        let prompt_tokens = req.estimate_prompt_tokens();
        let target_tokens = req.target_max_tokens().min(64);

        // Prefill time ~ 10ms + 0.1ms/token
        let prefill_ms = 10 + (prompt_tokens as u64 / 10);
        sleep(Duration::from_millis(prefill_ms)).await;

        // Decode time ~ 5ms/token
        let decode_ms = target_tokens as u64 * 4;
        sleep(Duration::from_millis(decode_ms)).await;

        self.active_requests.fetch_sub(1, Ordering::SeqCst);

        let response_text = format!(
            "MARDUK inference generated via device {} for model [{}]. Evaluated {} prompt tokens and produced {} completion tokens.",
            self.assigned_device_id, req.model, prompt_tokens, target_tokens
        );

        Ok(ChatCompletionResponse {
            id: format!("chatcmpl-{}", uuid::Uuid::new_v4().simple()),
            object: "chat.completion".to_string(),
            created: chrono::Utc::now().timestamp(),
            model: req.model,
            choices: vec![ChatChoice {
                index: 0,
                message: ChatMessage {
                    role: "assistant".to_string(),
                    content: response_text,
                    name: None,
                },
                finish_reason: Some("stop".to_string()),
            }],
            usage: Usage {
                prompt_tokens,
                completion_tokens: target_tokens,
                total_tokens: prompt_tokens + target_tokens,
            },
            routing_metadata: None,
        })
    }

    async fn generate_stream(&self, req: ChatCompletionRequest) -> Result<TokenStream> {
        let current_model =
            self.loaded_model
                .read()
                .clone()
                .ok_or_else(|| MardukError::Worker {
                    worker_id: format!("local-dev-{}", self.assigned_device_id),
                    message: "No model loaded on worker".to_string(),
                })?;

        if current_model != req.model {
            return Err(MardukError::ModelNotFound(format!(
                "Worker has '{}' loaded, requested '{}'",
                current_model, req.model
            )));
        }

        let model_name = req.model.clone();
        let request_id = format!("chatcmpl-{}", uuid::Uuid::new_v4().simple());
        let _device_id = self.assigned_device_id;
        let num_tokens = req.target_max_tokens().min(32);

        let stream = async_stream::stream! {
            let sample_tokens = vec![
                "MARDUK ", "GPU ", "orchestration ", "stream: ",
                "Request ", "routed ", "to ", "device ", "successfully. ",
                "Executing ", "continuous ", "batching ", "and ",
                "VRAM-aware ", "token ", "generation. "
            ];

            // Initial role chunk
            yield Ok(ChatCompletionChunk {
                id: request_id.clone(),
                object: "chat.completion.chunk".to_string(),
                created: chrono::Utc::now().timestamp(),
                model: model_name.clone(),
                choices: vec![ChatCompletionChunkChoice {
                    index: 0,
                    delta: ChatCompletionChunkChoiceDelta {
                        role: Some("assistant".to_string()),
                        content: None,
                    },
                    finish_reason: None,
                }],
            });

            for (i, token) in sample_tokens.iter().cycle().take(num_tokens).enumerate() {
                sleep(Duration::from_millis(15)).await;
                yield Ok(ChatCompletionChunk {
                    id: request_id.clone(),
                    object: "chat.completion.chunk".to_string(),
                    created: chrono::Utc::now().timestamp(),
                    model: model_name.clone(),
                    choices: vec![ChatCompletionChunkChoice {
                        index: 0,
                        delta: ChatCompletionChunkChoiceDelta {
                            role: None,
                            content: Some(token.to_string()),
                        },
                        finish_reason: if i == num_tokens - 1 { Some("stop".to_string()) } else { None },
                    }],
                });
            }
        };

        Ok(Box::pin(stream))
    }

    async fn check_health(&self) -> WorkerStatus {
        WorkerStatus::Healthy
    }
}
