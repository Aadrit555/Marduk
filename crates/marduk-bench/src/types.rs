use chrono::{DateTime, Utc};
use marduk_core::telemetry::GpuDevice;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BenchmarkType {
    ComputeCore,
    VramSpeed,
    TensorCore,
    AiInference,
    ThermalStability,
}

impl BenchmarkType {
    pub fn name(&self) -> &'static str {
        match self {
            BenchmarkType::ComputeCore => "Compute Core",
            BenchmarkType::VramSpeed => "VRAM Speed",
            BenchmarkType::TensorCore => "Tensor Core",
            BenchmarkType::AiInference => "AI Inference",
            BenchmarkType::ThermalStability => "Thermal & Stability",
        }
    }

    pub fn module_code(&self) -> &'static str {
        match self {
            BenchmarkType::ComputeCore => "MODULE 01",
            BenchmarkType::VramSpeed => "MODULE 02",
            BenchmarkType::TensorCore => "MODULE 03",
            BenchmarkType::AiInference => "MODULE 04",
            BenchmarkType::ThermalStability => "MODULE 05",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum JobStatus {
    Queued,
    Preflight,
    Running,
    Cooling,
    Completed,
    Cancelled,
    Failed,
    SafetyAborted,
    Unsupported,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareCapabilities {
    pub device_id: u32,
    pub device_name: String,
    pub compute_capability: Option<String>,
    pub driver_version: Option<String>,
    pub cuda_version: Option<String>,
    pub total_vram_bytes: u64,
    pub free_vram_bytes: u64,
    pub nvml_available: bool,
    pub tensor_cores_available: bool,
    pub tensor_core_generation: Option<String>,
    pub supported_precisions: Vec<String>,
    pub thermal_slowdown_celsius: Option<u32>,
    pub power_limit_mw: Option<u32>,
    pub safety_vram_reserve_bytes: u64,
    pub max_safe_allocation_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunBenchmarkRequest {
    pub test_type: BenchmarkType,
    pub device_id: Option<u32>,
    pub duration_seconds: Option<u32>,
    pub precision: Option<String>,
    pub model_id: Option<String>,
    pub use_cpu: Option<bool>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BenchmarkMetrics {
    pub duration_ms: f64,
    pub samples_count: usize,
    pub start_temp_c: Option<u32>,
    pub peak_temp_c: Option<u32>,
    pub start_vram_used_bytes: u64,
    pub peak_vram_used_bytes: u64,
    pub peak_power_mw: Option<u32>,
    pub avg_clock_mhz: Option<u32>,

    // Module 01: Compute Core
    pub achieved_tflops: Option<f64>,
    pub matrix_dim: Option<usize>,
    pub total_flops: Option<u64>,
    pub precision: Option<String>,

    // Module 02: VRAM Speed
    pub bandwidth_gbps: Option<f64>,
    pub allocated_bytes: Option<u64>,
    pub transferred_bytes: Option<u64>,

    // Module 03: Tensor Core
    pub tensor_tflops: Option<f64>,
    pub relative_error: Option<f64>,
    pub speedup_vs_fp32: Option<f64>,
    pub tensor_precision: Option<String>,

    // Module 04: AI Inference
    pub ttft_ms: Option<f64>,
    pub prompt_tokens: Option<usize>,
    pub output_tokens: Option<usize>,
    pub tokens_per_second: Option<f64>,
    pub inter_token_latency_p50_ms: Option<f64>,
    pub inter_token_latency_p95_ms: Option<f64>,

    // Module 05: Thermal & Stability
    pub temp_delta_c: Option<i32>,
    pub utilization_avg_pct: Option<f64>,
    pub throttling_events: Vec<String>,
    pub stability_score_pct: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MardukGpuRating {
    pub overall_score: Option<f64>,
    pub compute_score: f64,
    pub vram_score: f64,
    pub tensor_score: f64,
    pub stability_score: f64,
    pub inference_rating_note: String,
    pub comparability_confidence: String,
    pub benchmark_version: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkJob {
    pub run_id: String,
    pub test_type: BenchmarkType,
    pub device_id: u32,
    pub device_name: String,
    pub status: JobStatus,
    pub progress_percent: u32,
    pub current_stage: String,
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
    pub duration_secs: Option<f64>,
    pub config: RunBenchmarkRequest,
    pub hardware_metadata: GpuDevice,
    pub metrics: Option<BenchmarkMetrics>,
    pub safety_events: Vec<String>,
    pub failure_reason: Option<String>,
    pub rating: Option<MardukGpuRating>,
}

