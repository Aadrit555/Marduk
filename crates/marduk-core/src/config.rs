use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct MardukConfig {
    #[serde(default)]
    pub server: ServerConfig,
    #[serde(default)]
    pub gpu: GpuConfig,
    #[serde(default)]
    pub scheduler: SchedulerConfig,
    #[serde(default)]
    pub workers: WorkersConfig,
}

impl MardukConfig {
    pub fn load_from_file<P: AsRef<Path>>(path: P) -> Result<Self, crate::error::MardukError> {
        let content = std::fs::read_to_string(path.as_ref()).map_err(|e| {
            crate::error::MardukError::Config(format!("Failed to read config file: {}", e))
        })?;
        toml::from_str(&content).map_err(|e| {
            crate::error::MardukError::Config(format!("Failed to parse TOML config: {}", e))
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    #[serde(default = "default_host")]
    pub host: String,
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_timeout_secs")]
    pub request_timeout_secs: u64,
}

fn default_host() -> String {
    "127.0.0.1".to_string()
}

fn default_port() -> u16 {
    8080
}

fn default_timeout_secs() -> u64 {
    120
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            host: default_host(),
            port: default_port(),
            request_timeout_secs: default_timeout_secs(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuConfig {
    #[serde(default = "default_poll_interval_ms")]
    pub poll_interval_ms: u64,
    #[serde(default = "default_min_headroom_mb")]
    pub min_vram_headroom_mb: u64,
    #[serde(default = "default_enable_nvml")]
    pub enable_nvml: bool,
}

fn default_poll_interval_ms() -> u64 {
    500
}

fn default_min_headroom_mb() -> u64 {
    512
}

fn default_enable_nvml() -> bool {
    true
}

impl Default for GpuConfig {
    fn default() -> Self {
        Self {
            poll_interval_ms: default_poll_interval_ms(),
            min_vram_headroom_mb: default_min_headroom_mb(),
            enable_nvml: default_enable_nvml(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchedulerConfig {
    #[serde(default = "default_max_queue_per_worker")]
    pub max_queue_per_worker: usize,
    #[serde(default = "default_queue_weight")]
    pub weight_queue: f64,
    #[serde(default = "default_vram_weight")]
    pub weight_vram: f64,
    #[serde(default = "default_compute_weight")]
    pub weight_compute: f64,
    #[serde(default = "default_affinity_bonus")]
    pub affinity_bonus: f64,
    #[serde(default = "default_enable_learned")]
    pub enable_learned: bool,
    #[serde(default)]
    pub shadow_mode: bool,
}

fn default_max_queue_per_worker() -> usize {
    64
}

fn default_queue_weight() -> f64 {
    1.0
}

fn default_vram_weight() -> f64 {
    0.8
}

fn default_compute_weight() -> f64 {
    0.5
}

fn default_affinity_bonus() -> f64 {
    2.0
}

fn default_enable_learned() -> bool {
    false
}

impl Default for SchedulerConfig {
    fn default() -> Self {
        Self {
            max_queue_per_worker: default_max_queue_per_worker(),
            weight_queue: default_queue_weight(),
            weight_vram: default_vram_weight(),
            weight_compute: default_compute_weight(),
            affinity_bonus: default_affinity_bonus(),
            enable_learned: default_enable_learned(),
            shadow_mode: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkersConfig {
    #[serde(default = "default_auto_restart")]
    pub auto_restart: bool,
    #[serde(default = "default_heartbeat_timeout_ms")]
    pub heartbeat_timeout_ms: u64,
    #[serde(default)]
    pub default_model: Option<String>,
}

fn default_auto_restart() -> bool {
    true
}

fn default_heartbeat_timeout_ms() -> u64 {
    5000
}

impl Default for WorkersConfig {
    fn default() -> Self {
        Self {
            auto_restart: default_auto_restart(),
            heartbeat_timeout_ms: default_heartbeat_timeout_ms(),
            default_model: None,
        }
    }
}
