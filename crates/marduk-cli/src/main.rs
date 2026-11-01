use clap::{Parser, Subcommand};
use marduk_api::{run_server, AppState};
use marduk_bench::{BenchmarkConfig, BenchmarkHarness};
use marduk_core::config::MardukConfig;
use marduk_core::scheduler::SchedulerPolicy;
use marduk_core::worker::WorkerId;
use marduk_learned::LearnedSchedulerEngine;
use marduk_nvml::GpuTelemetryEngine;
use marduk_scheduler::Scheduler;
use marduk_worker::WorkerSupervisor;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

#[derive(Parser)]
#[command(
    name = "marduk",
    version = "0.1.0",
    author = "Aadrit <aadrit@marduk.ai>"
)]
#[command(
    about = "MARDUK: Intelligent GPU Inference Orchestration and Resource Management Platform"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Start MARDUK control and data plane HTTP server
    Serve {
        #[arg(long, default_value = "127.0.0.1")]
        host: String,

        #[arg(short, long, default_value = "8080")]
        port: u16,

        #[arg(short, long)]
        config: Option<PathBuf>,
    },

    /// Discover and inspect installed GPUs with live NVML telemetry
    Gpus {
        #[arg(long, default_value_t = true)]
        nvml: bool,
    },

    /// List registered inference workers
    Workers,

    /// Execute reproducible performance benchmark comparison
    Bench {
        #[arg(short, long, default_value_t = 4)]
        concurrency: usize,

        #[arg(short, long, default_value_t = 40)]
        requests: usize,

        #[arg(short, long, default_value = "mistral-7b-instruct")]
        model: String,
    },

    /// Train the learned workload predictor on collected execution traces
    Train {
        #[arg(short, long, default_value_t = 50)]
        epochs: usize,

        #[arg(short, long, default_value_t = 0.001)]
        lr: f64,
    },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .with_target(false)
        .finish();
    tracing::subscriber::set_global_default(subscriber)
        .map_err(|e| anyhow::anyhow!("Failed to set subscriber: {}", e))?;

    let cli = Cli::parse();

    match cli.command {
        Commands::Serve { host, port, config } => {
            let config_obj = if let Some(path) = config {
                info!("Loading configuration from {:?}", path);
                MardukConfig::load_from_file(path)?
            } else {
                MardukConfig::default()
            };

            let addr: SocketAddr = format!("{}:{}", host, port).parse()?;
            info!("Initializing MARDUK GPU Orchestration Platform on {}", addr);

            let telemetry = Arc::new(GpuTelemetryEngine::new(config_obj.gpu.enable_nvml));
            // Start background telemetry loop
            let _telemetry_handle = telemetry
                .clone()
                .start_telemetry_loop(Duration::from_millis(config_obj.gpu.poll_interval_ms));

            let supervisor = Arc::new(WorkerSupervisor::new(
                telemetry.clone(),
                config_obj.scheduler.max_queue_per_worker,
            ));

            // Automatically initialize workers for discovered physical GPUs
            let devices = telemetry.discovered_devices();
            if !devices.is_empty() {
                for dev in devices {
                    let w_id = WorkerId::from(format!("worker-gpu-{}", dev.id));
                    supervisor.spawn_local_worker(
                        w_id.clone(),
                        format!("Worker GPU {}", dev.id),
                        dev.id,
                        Some("mistral-7b-instruct".to_string()),
                        vec![
                            "mistral-7b-instruct".to_string(),
                            "llama-3-8b".to_string(),
                            "qwen-2.5-coder-7b".to_string(),
                        ],
                    )?;
                }
            } else {
                // If running in development without NVIDIA GPU, spawn host-CPU fallback worker
                let w_id = WorkerId::from("worker-cpu-0");
                supervisor.spawn_local_worker(
                    w_id,
                    "Host CPU Worker".to_string(),
                    0,
                    Some("mistral-7b-instruct".to_string()),
                    vec![
                        "mistral-7b-instruct".to_string(),
                        "llama-3-8b".to_string(),
                        "qwen-2.5-coder-7b".to_string(),
                    ],
                )?;
            }

            let scheduler = Arc::new(Scheduler::new(
                config_obj.scheduler,
                telemetry.clone(),
                supervisor.clone(),
            ));

            let learned_engine = Arc::new(LearnedSchedulerEngine::new());
            let state = AppState::new(telemetry, supervisor, scheduler, learned_engine);

            run_server(addr, state).await?;
        }

        Commands::Gpus { nvml } => {
            let engine = GpuTelemetryEngine::new(nvml);
            let devices = engine.discovered_devices();

            println!("\n=======================================================");
            println!("  MARDUK Hardware Discovery & NVML Telemetry");
            println!("=======================================================");
            println!(
                "NVML Status: {}",
                if engine.is_nvml_available() {
                    "ACTIVE"
                } else {
                    "NOT AVAILABLE"
                }
            );
            println!("Discovered Physical GPUs: {}\n", devices.len());

            for dev in devices {
                let metrics = engine.device_metrics(dev.id).ok();
                println!("GPU [{}] {}", dev.id, dev.name);
                println!("  PCI Bus ID:           {}", dev.pci_bus_id);
                println!("  UUID:                 {}", dev.uuid);
                println!(
                    "  Compute Capability:   {}",
                    dev.compute_capability.as_deref().unwrap_or("N/A")
                );
                println!(
                    "  Driver Version:       {}",
                    dev.driver_version.as_deref().unwrap_or("N/A")
                );
                println!(
                    "  CUDA Version:         {}",
                    dev.cuda_version.as_deref().unwrap_or("N/A")
                );
                println!(
                    "  Total VRAM:           {:.1} MB",
                    dev.total_memory_bytes as f64 / (1024.0 * 1024.0)
                );

                if let Some(m) = metrics {
                    println!(
                        "  Used VRAM:            {:.1} MB ({:.1}%)",
                        m.memory_used_mb(),
                        m.memory_pressure_ratio() * 100.0
                    );
                    println!("  Free VRAM:            {:.1} MB", m.memory_free_mb());
                    println!(
                        "  Compute Utilization:  {}%",
                        m.gpu_utilization_percent
                            .map(|u| u.to_string())
                            .unwrap_or_else(|| "N/A".to_string())
                    );
                    println!(
                        "  Memory Controller:    {}%",
                        m.memory_utilization_percent
                            .map(|u| u.to_string())
                            .unwrap_or_else(|| "N/A".to_string())
                    );
                    println!(
                        "  Temperature:          {} C",
                        m.temperature_celsius
                            .map(|t| t.to_string())
                            .unwrap_or_else(|| "N/A".to_string())
                    );
                    println!(
                        "  Power Usage:          {:.2} W / {:.2} W",
                        m.power_usage_milliwatts.unwrap_or(0) as f64 / 1000.0,
                        m.power_limit_milliwatts.unwrap_or(0) as f64 / 1000.0
                    );
                }
                println!("-------------------------------------------------------");
            }

            let sys = engine.system_telemetry();
            println!("\nHost System Telemetry:");
            println!("  Hostname:             {}", sys.hostname);
            println!("  OS:                   {}", sys.os_name);
            println!(
                "  CPU Cores:            {} ({:.1}% usage)",
                sys.cpu_count, sys.cpu_usage_percent
            );
            println!(
                "  System RAM:           {:.1} MB used / {:.1} MB total\n",
                sys.system_memory_used_bytes as f64 / (1024.0 * 1024.0),
                sys.system_memory_total_bytes as f64 / (1024.0 * 1024.0)
            );
        }

        Commands::Workers => {
            println!("To list live workers in production, run 'marduk serve' and query GET /api/v1/workers");
        }

        Commands::Bench {
            concurrency,
            requests,
            model,
        } => {
            println!("\n=======================================================");
            println!("  MARDUK Reproducible Performance Benchmark Harness");
            println!("=======================================================");

            let harness = BenchmarkHarness::new();
            let config = BenchmarkConfig {
                concurrency,
                total_requests: requests,
                model,
                max_tokens: 32,
                prompt_text: "Benchmark prompt test.".to_string(),
            };

            // 1. Run Round-Robin baseline
            let rr_res = harness
                .run_benchmark(
                    &config,
                    SchedulerPolicy::RoundRobinBaseline,
                    "Baseline Round-Robin",
                )
                .await;

            // 2. Run MARDUK Multi-Factor Intelligent Scheduler
            let marduk_res = harness
                .run_benchmark(
                    &config,
                    SchedulerPolicy::DeterministicMultiFactor,
                    "MARDUK Intelligent Scheduler",
                )
                .await;

            println!("\nBenchmark Results Summary Table:");
            println!("+------------------------------------+------------+------------+-----------+-----------+---------------+");
            println!("| Policy                             | RPS        | TPS        | P50 Lat   | P95 Lat   | Sched Overhead|");
            println!("+------------------------------------+------------+------------+-----------+-----------+---------------+");
            println!(
                "| {:<34} | {:>10.2} | {:>10.2} | {:>7.2}ms | {:>7.2}ms | {:>11.2}us |",
                rr_res.policy_name,
                rr_res.requests_per_second,
                rr_res.tokens_per_second,
                rr_res.latency.p50_ms,
                rr_res.latency.p95_ms,
                rr_res.scheduling_overhead_avg_us
            );
            println!(
                "| {:<34} | {:>10.2} | {:>10.2} | {:>7.2}ms | {:>7.2}ms | {:>11.2}us |",
                marduk_res.policy_name,
                marduk_res.requests_per_second,
                marduk_res.tokens_per_second,
                marduk_res.latency.p50_ms,
                marduk_res.latency.p95_ms,
                marduk_res.scheduling_overhead_avg_us
            );
            println!("+------------------------------------+------------+------------+-----------+-----------+---------------+");

            println!("\nDetailed JSON Output:");
            println!(
                "{}",
                serde_json::to_string_pretty(&vec![rr_res, marduk_res])?
            );
        }

        Commands::Train { epochs, lr } => {
            println!("Initializing Burn learned workload prediction model training...");
            let engine = LearnedSchedulerEngine::new();

            // Populate sample execution traces for training demo
            for i in 1..=50 {
                let prompt = (i * 20) as f64;
                let target = 32.0;
                let q_depth = (i % 5) as f64;
                let mem_pressure = 0.4 + (i % 4) as f64 * 0.1;
                let ttft = 10.0 + (prompt * 0.08);
                let total_ms = ttft + (target * 4.2) + (q_depth * 45.0);
                let peak_vram = 200.0 + (prompt * 0.05);

                engine.record_trace(marduk_learned::ExecutionTrace {
                    trace_id: format!("trace-{}", i),
                    timestamp: chrono::Utc::now(),
                    model: "mistral-7b-instruct".to_string(),
                    device_id: 0,
                    prompt_tokens: prompt,
                    target_tokens: target,
                    queue_depth: q_depth,
                    memory_pressure: mem_pressure,
                    measured_ttft_ms: ttft,
                    measured_total_latency_ms: total_ms,
                    measured_peak_vram_mb: peak_vram,
                });
            }

            let loss = engine.train_on_collected_traces(epochs, lr)?;
            println!("Training complete! Final Train Loss: {:.4}", loss);

            let pred = engine.predict_workload(256.0, 32.0, 2.0, 0.6);
            println!("\nPrediction for [Prompt: 256 tokens, Max: 32 tokens, Queue: 2, Mem: 60%]:");
            println!(
                "  Estimated TTFT:          {:.2} ms",
                pred.estimated_ttft_ms
            );
            println!(
                "  Estimated Total Latency: {:.2} ms",
                pred.estimated_total_latency_ms
            );
            println!(
                "  Estimated Peak VRAM:     {:.2} MB",
                pred.estimated_peak_vram_mb
            );
        }
    }

    Ok(())
}
