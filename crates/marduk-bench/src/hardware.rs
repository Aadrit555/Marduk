use chrono::Utc;
use marduk_nvml::GpuTelemetryEngine;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use sysinfo::System;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SimdExtensions {
    pub sse4_2: bool,
    pub avx: bool,
    pub avx2: bool,
    pub fma3: bool,
    pub avx512f: bool,
    pub neon: bool,
    pub amx: bool,
}

pub fn probe_simd_extensions() -> SimdExtensions {
    #[cfg(target_arch = "x86_64")]
    {
        SimdExtensions {
            sse4_2: is_x86_feature_detected!("sse4.2"),
            avx: is_x86_feature_detected!("avx"),
            avx2: is_x86_feature_detected!("avx2"),
            fma3: is_x86_feature_detected!("fma"),
            avx512f: is_x86_feature_detected!("avx512f"),
            neon: false,
            amx: false,
        }
    }

    #[cfg(target_arch = "aarch64")]
    {
        SimdExtensions {
            sse4_2: false,
            avx: false,
            avx2: false,
            fma3: false,
            avx512f: false,
            neon: true,
            amx: true,
        }
    }

    #[cfg(not(any(target_arch = "x86_64", target_arch = "aarch64")))]
    {
        SimdExtensions::default()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuTopology {
    pub brand: String,
    pub vendor_id: String,
    pub architecture: String,
    pub physical_cores: usize,
    pub logical_cores: usize,
    pub frequency_mhz: u64,
    pub simd: SimdExtensions,
    pub total_memory_bytes: u64,
    pub available_memory_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuTopology {
    pub device_id: u32,
    pub device_name: String,
    pub uuid: String,
    pub vendor: String,
    pub compute_capability: Option<String>,
    pub driver_version: Option<String>,
    pub cuda_version: Option<String>,
    pub total_memory_bytes: u64,
    pub free_memory_bytes: u64,
    pub has_tensor_cores: bool,
    pub tensor_core_generation: Option<String>,
    pub max_power_mw: Option<u32>,
    pub thermal_limit_celsius: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemHardwareSummary {
    pub os_name: String,
    pub os_version: String,
    pub hostname: String,
    pub cpu: CpuTopology,
    pub gpus: Vec<GpuTopology>,
    pub is_cpu_only: bool,
    pub primary_device_name: String,
    pub timestamp: chrono::DateTime<Utc>,
}

pub struct HardwareDiscoveryEngine;

impl HardwareDiscoveryEngine {
    pub fn discover_system(telemetry: &Arc<GpuTelemetryEngine>) -> SystemHardwareSummary {
        let mut sys = System::new_all();
        sys.refresh_all();

        let brand = sys
            .cpus()
            .first()
            .map(|c| c.brand().trim().to_string())
            .unwrap_or_else(|| "Unknown CPU".to_string());

        let vendor_id = sys
            .cpus()
            .first()
            .map(|c| c.vendor_id().trim().to_string())
            .unwrap_or_else(|| "Unknown Vendor".to_string());

        let frequency_mhz = sys.cpus().first().map(|c| c.frequency()).unwrap_or(0);
        let logical_cores = sys.cpus().len();
        let physical_cores = sys.physical_core_count().unwrap_or(logical_cores);
        let simd = probe_simd_extensions();

        let cpu = CpuTopology {
            brand: brand.clone(),
            vendor_id,
            architecture: std::env::consts::ARCH.to_string(),
            physical_cores,
            logical_cores,
            frequency_mhz,
            simd,
            total_memory_bytes: sys.total_memory(),
            available_memory_bytes: sys.available_memory(),
        };

        let raw_gpus = telemetry.discovered_devices();
        let mut gpus = Vec::new();

        for dev in raw_gpus {
            let metrics = telemetry.device_metrics(dev.id).ok();
            let free_mem = metrics.as_ref().map(|m| m.memory_free_bytes).unwrap_or(dev.total_memory_bytes / 2);
            let max_power = metrics.as_ref().and_then(|m| m.power_limit_milliwatts);

            let has_tensor = dev
                .compute_capability
                .as_ref()
                .map(|cc| {
                    let parts: Vec<&str> = cc.split('.').collect();
                    if let Some(major) = parts.first().and_then(|p| p.parse::<u32>().ok()) {
                        major >= 7
                    } else {
                        false
                    }
                })
                .unwrap_or(false);

            let tensor_gen = if let Some(ref cc) = dev.compute_capability {
                if cc.starts_with("8.9") {
                    Some("4th-Gen Ada Lovelace Tensor Cores".to_string())
                } else if cc.starts_with("9.0") {
                    Some("4th-Gen Hopper Tensor Cores".to_string())
                } else if cc.starts_with("8.") {
                    Some("3rd-Gen Ampere Tensor Cores".to_string())
                } else if cc.starts_with("7.5") {
                    Some("2nd-Gen Turing Tensor Cores".to_string())
                } else if cc.starts_with("7.0") {
                    Some("1st-Gen Volta Tensor Cores".to_string())
                } else {
                    Some("Tensor Engine".to_string())
                }
            } else {
                None
            };

            gpus.push(GpuTopology {
                device_id: dev.id,
                device_name: dev.name.clone(),
                uuid: dev.uuid.clone(),
                vendor: "NVIDIA".to_string(),
                compute_capability: dev.compute_capability.clone(),
                driver_version: dev.driver_version.clone(),
                cuda_version: dev.cuda_version.clone(),
                total_memory_bytes: dev.total_memory_bytes,
                free_memory_bytes: free_mem,
                has_tensor_cores: has_tensor,
                tensor_core_generation: tensor_gen,
                max_power_mw: max_power,
                thermal_limit_celsius: 80,
            });
        }

        let is_cpu_only = gpus.is_empty();
        let primary_device_name = if let Some(g) = gpus.first() {
            g.device_name.clone()
        } else {
            format!("Host CPU — {}", brand)
        };

        SystemHardwareSummary {
            os_name: System::name().unwrap_or_else(|| std::env::consts::OS.to_string()),
            os_version: System::os_version().unwrap_or_else(|| "Unknown".to_string()),
            hostname: System::host_name().unwrap_or_else(|| "localhost".to_string()),
            cpu,
            gpus,
            is_cpu_only,
            primary_device_name,
            timestamp: Utc::now(),
        }
    }
}
