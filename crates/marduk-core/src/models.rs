use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub family: String,
    pub parameter_count_billions: f32,
    pub context_window: usize,
    pub default_quantization: String,
    pub estimated_vram_mb: u64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatCompletionRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    #[serde(default = "default_temperature")]
    pub temperature: Option<f32>,
    #[serde(default = "default_top_p")]
    pub top_p: Option<f32>,
    pub max_tokens: Option<usize>,
    #[serde(default)]
    pub stream: bool,
    pub stop: Option<Vec<String>>,
    #[serde(default)]
    pub priority: Option<i32>,
}

fn default_temperature() -> Option<f32> {
    Some(0.7)
}

fn default_top_p() -> Option<f32> {
    Some(0.9)
}

impl ChatCompletionRequest {
    /// Rough heuristic for estimating prompt tokens before tokenizer evaluation
    pub fn estimate_prompt_tokens(&self) -> usize {
        let mut char_count = 0;
        for msg in &self.messages {
            char_count += msg.role.len() + msg.content.len();
        }
        // General rule of thumb ~4 chars per token
        (char_count / 4).max(1)
    }

    pub fn target_max_tokens(&self) -> usize {
        self.max_tokens.unwrap_or(512)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatChoice {
    pub index: usize,
    pub message: ChatMessage,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Usage {
    pub prompt_tokens: usize,
    pub completion_tokens: usize,
    pub total_tokens: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatCompletionResponse {
    pub id: String,
    pub object: String,
    pub created: i64,
    pub model: String,
    pub choices: Vec<ChatChoice>,
    pub usage: Usage,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub routing_metadata: Option<RoutingMetadata>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingMetadata {
    pub selected_worker_id: String,
    pub device_id: u32,
    pub queue_wait_ms: u64,
    pub inference_duration_ms: u64,
    pub routing_reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatCompletionChunkChoiceDelta {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatCompletionChunkChoice {
    pub index: usize,
    pub delta: ChatCompletionChunkChoiceDelta,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub finish_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatCompletionChunk {
    pub id: String,
    pub object: String,
    pub created: i64,
    pub model: String,
    pub choices: Vec<ChatCompletionChunkChoice>,
}
