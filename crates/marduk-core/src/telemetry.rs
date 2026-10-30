use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuDevice {
    pub id: u32,
    pub uuid: String,
    pub name: String,
    pub pci_bus_id: String,
    pub compute_capability: Option<String>,
    pub driver_version: Option<String>,
    pub cuda_version: Option<String>,
    pub total_memory_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuMetrics {
    pub device_id: u32,
    pub timestamp: DateTime<Utc>,
    pub memory_total_bytes: u64,
    pub memory_used_bytes: u64,
    pub memory_free_bytes: u64,
    pub gpu_utilization_percent: Option<u32>,
    pub memory_utilization_percent: Option<u32>,
    pub temperature_celsius: Option<u32>,
    pub power_usage_milliwatts: Option<u32>,
    pub power_limit_milliwatts: Option<u32>,
    pub graphics_clock_mhz: Option<u32>,
    pub memory_clock_mhz: Option<u32>,
    pub pcie_tx_kbps: Option<u32>,
    pub pcie_rx_kbps: Option<u32>,
    pub active_workers: Vec<String>,
}

impl GpuMetrics {
    pub fn memory_used_mb(&self) -> f64 {
        self.memory_used_bytes as f64 / (1024.0 * 1024.0)
    }

    pub fn memory_free_mb(&self) -> f64 {
        self.memory_free_bytes as f64 / (1024.0 * 1024.0)
    }

    pub fn memory_total_mb(&self) -> f64 {
        self.memory_total_bytes as f64 / (1024.0 * 1024.0)
    }

    pub fn memory_pressure_ratio(&self) -> f64 {
        if self.memory_total_bytes == 0 {
            0.0
        } else {
            self.memory_used_bytes as f64 / self.memory_total_bytes as f64
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemTelemetry {
    pub timestamp: DateTime<Utc>,
    pub hostname: String,
    pub os_name: String,
    pub cpu_count: usize,
    pub cpu_usage_percent: f32,
    pub system_memory_total_bytes: u64,
    pub system_memory_used_bytes: u64,
    pub gpus: Vec<GpuMetrics>,
}
