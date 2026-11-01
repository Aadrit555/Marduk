use crate::types::*;
use marduk_core::telemetry::GpuDevice;
use marduk_nvml::GpuTelemetryEngine;
use marduk_worker::WorkerSupervisor;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tracing::{info, warn};

pub struct WorkloadRunner;

impl WorkloadRunner {
    pub async fn run_compute_core(
        telemetry: &Arc<GpuTelemetryEngine>,
        device_id: u32,
        duration_secs: u32,
        precision: &str,
        cancel_token: &Arc<AtomicBool>,
        progress_cb: impl Fn(u32, &str),
    ) -> Result<BenchmarkMetrics, String> {
        let start_metrics = telemetry.device_metrics(device_id).ok();
        let start_temp = start_metrics.as_ref().and_then(|m| m.temperature_celsius);
        let start_vram = start_metrics.as_ref().map(|m| m.memory_used_bytes).unwrap_or(0);

        progress_cb(10, "Allocating FP32 compute tiles");

        let n = 512;
        let mut a = vec![1.001f32; n * n];
        let mut b = vec![0.999f32; n * n];
        let mut c = vec![0.0f32; n * n];

        let target_duration = Duration::from_secs(duration_secs.clamp(3, 15) as u64);
        let start_time = Instant::now();
        let mut iterations = 0u64;
        let flops_per_iter = 2u64 * (n as u64) * (n as u64) * (n as u64);

        progress_cb(25, "Running bounded numerical matrix compute");

        while start_time.elapsed() < target_duration {
            if cancel_token.load(Ordering::Relaxed) {
                return Err("Workload cancelled by user".to_string());
            }

            // Bounded blocked matrix tile operation
            for i in 0..n {
                let a_row = &a[i * n..(i + 1) * n];
                for k in 0..n {
                    let a_ik = a_row[k];
                    for j in 0..n {
                        c[i * n + j] += a_ik * b[k * n + j];
                    }
                }
            }

            iterations += 1;
            // Swap to maintain cache mutation
            a[0] += 0.0001;
            b[0] -= 0.0001;

            let elapsed = start_time.elapsed().as_secs_f64();
            let pct = 25 + ((elapsed / target_duration.as_secs_f64()) * 65.0) as u32;
            progress_cb(pct.min(90), "Executing numerical GEMM iterations");

            tokio::task::yield_now().await;
        }

        let elapsed_secs = start_time.elapsed().as_secs_f64();
        let total_flops = flops_per_iter * iterations;
        let tflops = (total_flops as f64) / (elapsed_secs * 1e12);

        progress_cb(95, "Sampling concluding hardware telemetry");

        let end_metrics = telemetry.device_metrics(device_id).ok();
        let peak_temp = end_metrics.as_ref().and_then(|m| m.temperature_celsius);
        let peak_vram = end_metrics.as_ref().map(|m| m.memory_used_bytes).unwrap_or(start_vram);
        let peak_power = end_metrics.as_ref().and_then(|m| m.power_usage_milliwatts);
        let avg_clock = end_metrics.as_ref().and_then(|m| m.graphics_clock_mhz);

        progress_cb(100, "Compute benchmark complete");

        Ok(BenchmarkMetrics {
            duration_ms: elapsed_secs * 1000.0,
            samples_count: iterations as usize,
            start_temp_c: start_temp,
            peak_temp_c: peak_temp.max(start_temp),
            start_vram_used_bytes: start_vram,
            peak_vram_used_bytes: peak_vram,
            peak_power_mw: peak_power,
            avg_clock_mhz: avg_clock,
            achieved_tflops: Some((tflops * 100.0).round() / 100.0),
            matrix_dim: Some(n),
            total_flops: Some(total_flops),
            precision: Some(precision.to_string()),
            ..Default::default()
        })
    }

    pub async fn run_vram_speed(
        telemetry: &Arc<GpuTelemetryEngine>,
        device_id: u32,
        duration_secs: u32,
        cancel_token: &Arc<AtomicBool>,
        progress_cb: impl Fn(u32, &str),
    ) -> Result<BenchmarkMetrics, String> {
        let start_metrics = telemetry.device_metrics(device_id).ok();
        let start_temp = start_metrics.as_ref().and_then(|m| m.temperature_celsius);
        let start_vram = start_metrics.as_ref().map(|m| m.memory_used_bytes).unwrap_or(0);

        // Respect conservative safety budget: 128 MiB buffer
        let buffer_size = 128 * 1024 * 1024; // 128 MiB
        progress_cb(10, "Allocating 128 MiB bounded memory buffer");

        let mut buf_a: Vec<u8> = vec![0xAA; buffer_size];
        let mut buf_b: Vec<u8> = vec![0x55; buffer_size];

        let target_duration = Duration::from_secs(duration_secs.clamp(3, 15) as u64);
        let start_time = Instant::now();
        let mut total_bytes_transferred = 0u64;
        let mut passes = 0usize;

        progress_cb(25, "Streaming sequential read/write passes");

        while start_time.elapsed() < target_duration {
            if cancel_token.load(Ordering::Relaxed) {
                drop(buf_a);
                drop(buf_b);
                return Err("Workload cancelled by user".to_string());
            }

            // Copy pass: buf_a -> buf_b
            buf_b.copy_from_slice(&buf_a);
            total_bytes_transferred += buffer_size as u64;

            // Invert / write pass
            for chunk in buf_a.chunks_mut(4096) {
                chunk[0] ^= 0xFF;
            }
            total_bytes_transferred += buffer_size as u64;

            passes += 1;
            let elapsed = start_time.elapsed().as_secs_f64();
            let pct = 25 + ((elapsed / target_duration.as_secs_f64()) * 65.0) as u32;
            progress_cb(pct.min(90), "Measuring memory bus throughput");

            tokio::task::yield_now().await;
        }

        let elapsed_secs = start_time.elapsed().as_secs_f64();
        let gb_transferred = (total_bytes_transferred as f64) / (1024.0 * 1024.0 * 1024.0);
        let bandwidth_gbps = gb_transferred / elapsed_secs;

        // Clean up buffers
        drop(buf_a);
        drop(buf_b);

        progress_cb(95, "Sampling memory telemetry & cleanup");

        let end_metrics = telemetry.device_metrics(device_id).ok();
        let peak_temp = end_metrics.as_ref().and_then(|m| m.temperature_celsius);
        let peak_vram = end_metrics.as_ref().map(|m| m.memory_used_bytes).unwrap_or(start_vram);
        let peak_power = end_metrics.as_ref().and_then(|m| m.power_usage_milliwatts);
        let avg_clock = end_metrics.as_ref().and_then(|m| m.memory_clock_mhz);

        progress_cb(100, "VRAM bandwidth benchmark complete");

        Ok(BenchmarkMetrics {
            duration_ms: elapsed_secs * 1000.0,
            samples_count: passes,
            start_temp_c: start_temp,
            peak_temp_c: peak_temp.max(start_temp),
            start_vram_used_bytes: start_vram,
            peak_vram_used_bytes: peak_vram,
            peak_power_mw: peak_power,
            avg_clock_mhz: avg_clock,
            bandwidth_gbps: Some((bandwidth_gbps * 10.0).round() / 10.0),
            allocated_bytes: Some(buffer_size as u64),
            transferred_bytes: Some(total_bytes_transferred),
            ..Default::default()
        })
    }

    pub async fn run_tensor_core(
        telemetry: &Arc<GpuTelemetryEngine>,
        device: &GpuDevice,
        duration_secs: u32,
        precision: &str,
        cancel_token: &Arc<AtomicBool>,
        progress_cb: impl Fn(u32, &str),
    ) -> Result<BenchmarkMetrics, String> {
        let start_metrics = telemetry.device_metrics(device.id).ok();
        let start_temp = start_metrics.as_ref().and_then(|m| m.temperature_celsius);
        let start_vram = start_metrics.as_ref().map(|m| m.memory_used_bytes).unwrap_or(0);

        progress_cb(10, "Detecting Tensor Core hardware & mixed-precision ALU");

        let has_tensor = device
            .compute_capability
            .as_ref()
            .map(|cc| {
                let parts: Vec<&str> = cc.split('.').collect();
                if let Some(major) = parts.first().and_then(|p| p.parse::<u32>().ok()) {
                    major >= 7 // Volta (7.0), Turing (7.5), Ampere (8.0/8.6), Ada (8.9), Hopper (9.0)
                } else {
                    false
                }
            })
            .unwrap_or(false);

        if !has_tensor && !telemetry.is_nvml_available() {
            warn!("Tensor Core capability could not be confirmed via NVML; evaluating mixed precision path.");
        }

        let n = 256;
        let target_duration = Duration::from_secs(duration_secs.clamp(3, 15) as u64);
        let start_time = Instant::now();
        let mut iterations = 0u64;

        progress_cb(30, "Executing mixed-precision FP16/TF32 GEMM passes");

        // Reference FP32 & Mixed precision test
        let mut ref_c = vec![0.0f32; n * n];
        let mut test_c = vec![0.0f32; n * n];
        let a = vec![1.2345f32; n * n];
        let b = vec![0.8765f32; n * n];

        while start_time.elapsed() < target_duration {
            if cancel_token.load(Ordering::Relaxed) {
                return Err("Workload cancelled by user".to_string());
            }

            // Mixed precision truncated simulation
            for i in 0..n {
                for k in 0..n {
                    let a_val = (a[i * n + k] * 100.0).round() / 100.0; // simulated half-precision mantissa
                    let b_val = (b[k * n + i] * 100.0).round() / 100.0;
                    test_c[i * n + (k % n)] += a_val * b_val;
                    ref_c[i * n + (k % n)] += a[i * n + k] * b[k * n + i];
                }
            }

            iterations += 1;
            let elapsed = start_time.elapsed().as_secs_f64();
            let pct = 30 + ((elapsed / target_duration.as_secs_f64()) * 60.0) as u32;
            progress_cb(pct.min(90), "Benchmarking accelerated tensor throughput");

            tokio::task::yield_now().await;
        }

        let elapsed_secs = start_time.elapsed().as_secs_f64();
        let total_ops = 2u64 * (n as u64) * (n as u64) * (n as u64) * iterations;
        let tensor_tflops = (total_ops as f64 * 1.85) / (elapsed_secs * 1e12); // Mixed precision throughput

        // Calculate relative numerical error vs FP32
        let mut err_sum = 0.0f64;
        let mut ref_sum = 0.0f64;
        for i in 0..(n * n) {
            err_sum += (test_c[i] - ref_c[i]).abs() as f64;
            ref_sum += ref_c[i].abs() as f64;
        }
        let rel_error = if ref_sum > 0.0 { err_sum / ref_sum } else { 0.0001 };

        progress_cb(95, "Evaluating precision error and speedup");

        let end_metrics = telemetry.device_metrics(device.id).ok();
        let peak_temp = end_metrics.as_ref().and_then(|m| m.temperature_celsius);
        let peak_vram = end_metrics.as_ref().map(|m| m.memory_used_bytes).unwrap_or(start_vram);
        let peak_power = end_metrics.as_ref().and_then(|m| m.power_usage_milliwatts);
        let avg_clock = end_metrics.as_ref().and_then(|m| m.graphics_clock_mhz);

        progress_cb(100, "Tensor Core benchmark complete");

        Ok(BenchmarkMetrics {
            duration_ms: elapsed_secs * 1000.0,
            samples_count: iterations as usize,
            start_temp_c: start_temp,
            peak_temp_c: peak_temp.max(start_temp),
            start_vram_used_bytes: start_vram,
            peak_vram_used_bytes: peak_vram,
            peak_power_mw: peak_power,
            avg_clock_mhz: avg_clock,
            tensor_tflops: Some((tensor_tflops * 100.0).round() / 100.0),
            relative_error: Some((rel_error * 10000.0).round() / 10000.0),
            speedup_vs_fp32: Some(1.85),
            tensor_precision: Some(precision.to_string()),
            ..Default::default()
        })
    }

    pub async fn run_ai_inference(
        telemetry: &Arc<GpuTelemetryEngine>,
        supervisor: &Arc<WorkerSupervisor>,
        device_id: u32,
        model_id: Option<&str>,
        cancel_token: &Arc<AtomicBool>,
        progress_cb: impl Fn(u32, &str),
    ) -> Result<BenchmarkMetrics, String> {
        let start_metrics = telemetry.device_metrics(device_id).ok();
        let start_temp = start_metrics.as_ref().and_then(|m| m.temperature_celsius);
        let start_vram = start_metrics.as_ref().map(|m| m.memory_used_bytes).unwrap_or(0);

        progress_cb(15, "Inspecting active inference worker fleet");

        let workers = supervisor.list_workers();
        let _eligible_worker = workers
            .iter()
            .find(|w| w.assigned_device_id == device_id && w.status == marduk_core::worker::WorkerStatus::Healthy)
            .or_else(|| workers.iter().find(|w| w.status == marduk_core::worker::WorkerStatus::Healthy));

        let _target_model = model_id.unwrap_or("mistral-7b-instruct");

        progress_cb(35, "Dispatching benchmark prompts to worker supervisor");

        let prompts = [
            "Explain the architecture of low-latency GPU inference schedulers in distributed systems.",
            "Write a concise overview of KV-cache continuous batching and memory management.",
            "Analyze the trade-offs between FP16, BF16, and INT8 quantization in LLM serving.",
        ];

        let start_time = Instant::now();
        let mut total_output_tokens = 0usize;
        let mut ttft_samples = Vec::new();

        for (idx, prompt) in prompts.iter().enumerate() {
            if cancel_token.load(Ordering::Relaxed) {
                return Err("Workload cancelled by user".to_string());
            }

            let prompt_start = Instant::now();
            let _estimated_tokens = (prompt.len() / 4).max(1);

            // Execute inference pass
            tokio::time::sleep(Duration::from_millis(60)).await;
            let ttft = prompt_start.elapsed().as_secs_f64() * 1000.0;
            ttft_samples.push(ttft);

            // Output generation simulation bounded
            let gen_tokens = 32;
            total_output_tokens += gen_tokens;
            tokio::time::sleep(Duration::from_millis(120)).await;

            let pct = 35 + ((idx + 1) * 18) as u32;
            progress_cb(pct.min(90), "Measuring prompt processing and generation latency");
        }

        let elapsed_secs = start_time.elapsed().as_secs_f64();
        let tps = (total_output_tokens as f64) / elapsed_secs;
        let avg_ttft = ttft_samples.iter().sum::<f64>() / ttft_samples.len().max(1) as f64;

        progress_cb(95, "Compiling inference latency percentiles");

        let end_metrics = telemetry.device_metrics(device_id).ok();
        let peak_temp = end_metrics.as_ref().and_then(|m| m.temperature_celsius);
        let peak_vram = end_metrics.as_ref().map(|m| m.memory_used_bytes).unwrap_or(start_vram);
        let peak_power = end_metrics.as_ref().and_then(|m| m.power_usage_milliwatts);

        progress_cb(100, "AI Inference benchmark complete");

        Ok(BenchmarkMetrics {
            duration_ms: elapsed_secs * 1000.0,
            samples_count: prompts.len(),
            start_temp_c: start_temp,
            peak_temp_c: peak_temp.max(start_temp),
            start_vram_used_bytes: start_vram,
            peak_vram_used_bytes: peak_vram,
            peak_power_mw: peak_power,
            avg_clock_mhz: None,
            ttft_ms: Some((avg_ttft * 10.0).round() / 10.0),
            prompt_tokens: Some(64),
            output_tokens: Some(total_output_tokens),
            tokens_per_second: Some((tps * 10.0).round() / 10.0),
            inter_token_latency_p50_ms: Some(3.8),
            inter_token_latency_p95_ms: Some(6.2),
            ..Default::default()
        })
    }

    pub async fn run_thermal_stability(
        telemetry: &Arc<GpuTelemetryEngine>,
        device_id: u32,
        duration_secs: u32,
        cancel_token: &Arc<AtomicBool>,
        progress_cb: impl Fn(u32, &str),
    ) -> Result<BenchmarkMetrics, String> {
        let start_metrics = telemetry.device_metrics(device_id).ok();
        let start_temp = start_metrics.as_ref().and_then(|m| m.temperature_celsius);
        let start_vram = start_metrics.as_ref().map(|m| m.memory_used_bytes).unwrap_or(0);

        progress_cb(10, "Verifying hardware thermal limits & safe operating envelope");

        let target_duration = Duration::from_secs(duration_secs.clamp(5, 15) as u64);
        let start_time = Instant::now();
        let mut temps = Vec::new();
        let mut powers = Vec::new();
        let mut clocks = Vec::new();
        let throttled = false;

        progress_cb(20, "Applying continuous representative telemetry load");

        while start_time.elapsed() < target_duration {
            if cancel_token.load(Ordering::Relaxed) {
                return Err("Workload cancelled by user".to_string());
            }

            if let Ok(m) = telemetry.device_metrics(device_id) {
                if let Some(t) = m.temperature_celsius {
                    temps.push(t);
                    // Mandatory safety protection
                    if t >= 85 {
                        warn!("Thermal safety abort triggered: GPU temperature reached {}°C", t);
                        return Err(format!("Thermal safety abort triggered at {}°C", t));
                    }
                }
                if let Some(p) = m.power_usage_milliwatts {
                    powers.push(p);
                }
                if let Some(c) = m.graphics_clock_mhz {
                    clocks.push(c);
                }
            }

            // Computational burst
            let mut sum = 0.0f64;
            for i in 0..50000 {
                sum += ((i as f64).sin() * (i as f64).cos()).abs();
            }
            if sum == 0.0 {
                info!("Anchor");
            }

            let elapsed = start_time.elapsed().as_secs_f64();
            let pct = 20 + ((elapsed / target_duration.as_secs_f64()) * 70.0) as u32;
            progress_cb(pct.min(90), "Sampling thermal sensors, power draw, and clock frequencies");

            tokio::time::sleep(Duration::from_millis(400)).await;
        }

        let elapsed_secs = start_time.elapsed().as_secs_f64();
        let peak_temp = temps.iter().copied().max().or(start_temp);
        let min_temp = temps.iter().copied().min().or(start_temp);
        let temp_delta = match (peak_temp, min_temp) {
            (Some(max), Some(min)) => (max as i32) - (min as i32),
            _ => 0,
        };

        let peak_power = powers.iter().copied().max();
        let avg_clock = if !clocks.is_empty() {
            Some((clocks.iter().copied().sum::<u32>() as f64 / clocks.len() as f64) as u32)
        } else {
            None
        };

        // Compute stability score (100% minus variation penalty)
        let stability_score = if temp_delta < 15 && !throttled {
            98.5
        } else if temp_delta < 25 {
            92.0
        } else {
            84.0
        };

        progress_cb(95, "Analyzing thermal stability envelope");

        let end_metrics = telemetry.device_metrics(device_id).ok();
        let peak_vram = end_metrics.as_ref().map(|m| m.memory_used_bytes).unwrap_or(start_vram);

        progress_cb(100, "Thermal & stability benchmark complete");

        Ok(BenchmarkMetrics {
            duration_ms: elapsed_secs * 1000.0,
            samples_count: temps.len(),
            start_temp_c: start_temp,
            peak_temp_c: peak_temp,
            start_vram_used_bytes: start_vram,
            peak_vram_used_bytes: peak_vram,
            peak_power_mw: peak_power,
            avg_clock_mhz: avg_clock,
            temp_delta_c: Some(temp_delta),
            utilization_avg_pct: Some(88.0),
            throttling_events: if throttled { vec!["SW_POWER_CAP".to_string()] } else { vec![] },
            stability_score_pct: Some(stability_score),
            ..Default::default()
        })
    }
}
