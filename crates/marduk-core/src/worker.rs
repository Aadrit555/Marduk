use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct WorkerId(pub String);

impl std::fmt::Display for WorkerId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<&str> for WorkerId {
    fn from(s: &str) -> Self {
        Self(s.to_string())
    }
}

impl From<String> for WorkerId {
    fn from(s: String) -> Self {
        Self(s)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WorkerStatus {
    Starting,
    Healthy,
    Busy,
    Degraded,
    Stopping,
    Stopped,
    Failed,
}

impl std::fmt::Display for WorkerStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Starting => write!(f, "starting"),
            Self::Healthy => write!(f, "healthy"),
            Self::Busy => write!(f, "busy"),
            Self::Degraded => write!(f, "degraded"),
            Self::Stopping => write!(f, "stopping"),
            Self::Stopped => write!(f, "stopped"),
            Self::Failed => write!(f, "failed"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerInfo {
    pub id: WorkerId,
    pub name: String,
    pub status: WorkerStatus,
    pub assigned_device_id: u32,
    pub loaded_model: Option<String>,
    pub supported_models: Vec<String>,
    pub current_queue_depth: usize,
    pub max_queue_capacity: usize,
    pub active_requests: usize,
    pub total_requests_processed: u64,
    pub total_tokens_generated: u64,
    pub average_latency_ms: f64,
    pub last_heartbeat: DateTime<Utc>,
    pub started_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerHeartbeat {
    pub worker_id: WorkerId,
    pub timestamp: DateTime<Utc>,
    pub status: WorkerStatus,
    pub loaded_model: Option<String>,
    pub current_queue_depth: usize,
    pub active_requests: usize,
    pub recent_latency_ms: Option<f64>,
}
