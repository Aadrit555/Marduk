use thiserror::Error;

#[derive(Error, Debug, Clone)]
pub enum MardukError {
    #[error("Configuration error: {0}")]
    Config(String),

    #[error("GPU telemetry error: {0}")]
    Gpu(String),

    #[error("Worker error [{worker_id}]: {message}")]
    Worker { worker_id: String, message: String },

    #[error("Model not found: {0}")]
    ModelNotFound(String),

    #[error("No eligible workers available: {0}")]
    NoEligibleWorker(String),

    #[error("Queue capacity exceeded (Backpressure): {0}")]
    QueueFull(String),

    #[error("Request timed out: {0}")]
    Timeout(String),

    #[error("Inference execution failed: {0}")]
    Inference(String),

    #[error("Request cancelled by client")]
    Cancelled,

    #[error("Internal system error: {0}")]
    Internal(String),
}

pub type Result<T> = std::result::Result<T, MardukError>;
