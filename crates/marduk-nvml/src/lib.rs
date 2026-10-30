use chrono::Utc;
use marduk_core::error::{MardukError, Result};
use marduk_core::telemetry::{GpuDevice, GpuMetrics, SystemTelemetry};
use nvml_wrapper::enum_wrappers::device::{Clock, TemperatureSensor};
use nvml_wrapper::Nvml;
use parking_lot::RwLock;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use sysinfo::System;
use tracing::{debug, info, warn};

pub struct GpuTelemetryEngine {
    nvml: Option<Arc<Nvml>>,
    devices: Vec<GpuDevice>,
    metrics_cache: Arc<RwLock<Vec<GpuMetrics>>>,
    worker_mappings: Arc<RwLock<HashMap<u32, Vec<String>>>>,
    system_tracker: Arc<RwLock<System>>,
}

impl GpuTelemetryEngine {
    pub fn new(enable_nvml: bool) -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();

        let mut devices = Vec::new();
        let nvml_opt = if enable_nvml {
            match Nvml::init() {
                Ok(nvml) => {
                    info!("Successfully initialized NVML");
                    let driver_ver = nvml.sys_driver_version().ok();
                    let cuda_ver = nvml
                        .sys_cuda_driver_version()
                        .ok()
                        .map(|v| format!("{}.{}", v / 1000, (v % 1000) / 10));

                    if let Ok(count) = nvml.device_count() {
                        info!("NVML discovered {} physical GPU device(s)", count);
                        for idx in 0..count {
                            if let Ok(device) = nvml.device_by_index(idx) {
                                let name = device.name().unwrap_or_else(|_| format!("GPU {}", idx));
                                let uuid = device
                                    .uuid()
                                    .unwrap_or_else(|_| format!("unknown-uuid-{}", idx));
                                let pci_bus_id = device
                                    .pci_info()
                                    .map(|p| p.bus_id)
                                    .unwrap_or_else(|_| "0000:00:00.0".to_string());
                                let mem_total = device.memory_info().map(|m| m.total).unwrap_or(0);
                                let compute_cap = device
                                    .cuda_compute_capability()
                                    .ok()
                                    .map(|c| format!("{}.{}", c.major, c.minor));

                                info!(
                                    "Discovered GPU [{}]: {} (VRAM: {:.1} MB, UUID: {})",
                                    idx,
                                    name,
                                    mem_total as f64 / (1024.0 * 1024.0),
                                    uuid
                                );

                                devices.push(GpuDevice {
                                    id: idx,
                                    uuid,
                                    name,
                                    pci_bus_id,
                                    compute_capability: compute_cap,
                                    driver_version: driver_ver.clone(),
                                    cuda_version: cuda_ver.clone(),
                                    total_memory_bytes: mem_total,
                                });
                            }
                        }
                    }
                    Some(Arc::new(nvml))
                }
                Err(e) => {
                    warn!(
                        "NVML could not be initialized ({}). Operating with system-only telemetry.",
                        e
                    );
                    None
                }
            }
        } else {
            debug!("NVML explicitly disabled in configuration.");
            None
        };

        let initial_metrics = Self::sample_gpu_metrics(&nvml_opt, &devices, &HashMap::new());

        Self {
            nvml: nvml_opt,
            devices,
            metrics_cache: Arc::new(RwLock::new(initial_metrics)),
            worker_mappings: Arc::new(RwLock::new(HashMap::new())),
            system_tracker: Arc::new(RwLock::new(sys)),
        }
    }

    pub fn discovered_devices(&self) -> &[GpuDevice] {
        &self.devices
    }

    pub fn is_nvml_available(&self) -> bool {
        self.nvml.is_some()
    }

    pub fn assign_worker_to_device(&self, device_id: u32, worker_id: String) {
        let mut map = self.worker_mappings.write();
        let list = map.entry(device_id).or_default();
        if !list.contains(&worker_id) {
            list.push(worker_id);
        }
    }

    pub fn remove_worker_from_device(&self, device_id: u32, worker_id: &str) {
        let mut map = self.worker_mappings.write();
        if let Some(list) = map.get_mut(&device_id) {
            list.retain(|id| id != worker_id);
        }
    }

    pub fn current_metrics(&self) -> Vec<GpuMetrics> {
        self.metrics_cache.read().clone()
    }

    pub fn device_metrics(&self, device_id: u32) -> Result<GpuMetrics> {
        let cache = self.metrics_cache.read();
        cache
            .iter()
            .find(|m| m.device_id == device_id)
            .cloned()
            .ok_or_else(|| {
                MardukError::Gpu(format!(
                    "Device ID {} not found in metrics cache",
                    device_id
                ))
            })
    }

    pub fn system_telemetry(&self) -> SystemTelemetry {
        let mut sys = self.system_tracker.write();
        sys.refresh_cpu_all();
        sys.refresh_memory();

        let cpu_count = sys.cpus().len();
        let cpu_usage: f32 = if cpu_count > 0 {
            sys.cpus().iter().map(|c| c.cpu_usage()).sum::<f32>() / cpu_count as f32
        } else {
            0.0
        };

        SystemTelemetry {
            timestamp: Utc::now(),
            hostname: System::host_name().unwrap_or_else(|| "localhost".to_string()),
            os_name: System::long_os_version().unwrap_or_else(|| "Windows/Generic".to_string()),
            cpu_count,
            cpu_usage_percent: cpu_usage,
            system_memory_total_bytes: sys.total_memory(),
            system_memory_used_bytes: sys.used_memory(),
            gpus: self.current_metrics(),
        }
    }

    fn sample_gpu_metrics(
        nvml: &Option<Arc<Nvml>>,
        devices: &[GpuDevice],
        worker_map: &HashMap<u32, Vec<String>>,
    ) -> Vec<GpuMetrics> {
        let mut metrics = Vec::new();

        if let Some(nvml_ref) = nvml {
            for dev_info in devices {
                if let Ok(dev) = nvml_ref.device_by_index(dev_info.id) {
                    let mem = dev.memory_info().ok();
                    let util = dev.utilization_rates().ok();
                    let temp = dev.temperature(TemperatureSensor::Gpu).ok();
                    let power = dev.power_usage().ok();
                    let power_limit = dev.enforced_power_limit().ok();
                    let gfx_clock = dev.clock_info(Clock::Graphics).ok();
                    let mem_clock = dev.clock_info(Clock::Memory).ok();

                    let active_workers = worker_map.get(&dev_info.id).cloned().unwrap_or_default();

                    metrics.push(GpuMetrics {
                        device_id: dev_info.id,
                        timestamp: Utc::now(),
                        memory_total_bytes: mem
                            .as_ref()
                            .map(|m| m.total)
                            .unwrap_or(dev_info.total_memory_bytes),
                        memory_used_bytes: mem.as_ref().map(|m| m.used).unwrap_or(0),
                        memory_free_bytes: mem.as_ref().map(|m| m.free).unwrap_or(0),
                        gpu_utilization_percent: util.as_ref().map(|u| u.gpu),
                        memory_utilization_percent: util.as_ref().map(|u| u.memory),
                        temperature_celsius: temp,
                        power_usage_milliwatts: power,
                        power_limit_milliwatts: power_limit,
                        graphics_clock_mhz: gfx_clock,
                        memory_clock_mhz: mem_clock,
                        pcie_tx_kbps: None,
                        pcie_rx_kbps: None,
                        active_workers,
                    });
                }
            }
        }

        metrics
    }

    pub fn start_telemetry_loop(
        self: Arc<Self>,
        poll_interval: Duration,
    ) -> tokio::task::JoinHandle<()> {
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(poll_interval);
            loop {
                interval.tick().await;
                let worker_map = self.worker_mappings.read().clone();
                let new_metrics = Self::sample_gpu_metrics(&self.nvml, &self.devices, &worker_map);
                *self.metrics_cache.write() = new_metrics;
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_telemetry_engine_instantiation() {
        let engine = GpuTelemetryEngine::new(true);
        let telemetry = engine.system_telemetry();
        assert!(telemetry.cpu_count > 0);
        assert!(telemetry.system_memory_total_bytes > 0);
    }
}
