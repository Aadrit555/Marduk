use marduk_bench::{
    BenchmarkEngine, BenchmarkJob, BenchmarkJobRecord, HardwareCapabilities, RunBenchmarkRequest,
    SystemHardwareSummary, SystemRating,
};
use marduk_nvml::GpuTelemetryEngine;
use marduk_worker::WorkerSupervisor;
use std::sync::Arc;
use tauri::Manager;
use tracing::info;

#[tauri::command]
async fn get_system_info(
    engine: tauri::State<'_, Arc<BenchmarkEngine>>,
) -> Result<SystemHardwareSummary, String> {
    Ok(engine.get_system_hardware())
}

#[tauri::command]
async fn get_hardware_capabilities(
    engine: tauri::State<'_, Arc<BenchmarkEngine>>,
) -> Result<HardwareCapabilities, String> {
    Ok(engine.get_capabilities())
}

#[tauri::command]
async fn run_benchmark(
    engine: tauri::State<'_, Arc<BenchmarkEngine>>,
    req: RunBenchmarkRequest,
) -> Result<String, String> {
    engine.submit_job(req).await
}

#[tauri::command]
async fn cancel_benchmark(
    engine: tauri::State<'_, Arc<BenchmarkEngine>>,
    run_id: String,
) -> Result<(), String> {
    engine.cancel_job(&run_id)
}

#[tauri::command]
async fn get_benchmark_job(
    engine: tauri::State<'_, Arc<BenchmarkEngine>>,
    run_id: String,
) -> Result<Option<BenchmarkJob>, String> {
    Ok(engine.get_job(&run_id))
}

#[tauri::command]
async fn get_benchmark_history(
    engine: tauri::State<'_, Arc<BenchmarkEngine>>,
) -> Result<Vec<BenchmarkJobRecord>, String> {
    engine.storage().get_recent_runs(100)
}

#[tauri::command]
async fn get_system_rating(
    engine: tauri::State<'_, Arc<BenchmarkEngine>>,
) -> Result<SystemRating, String> {
    Ok(engine.get_system_rating())
}

#[tauri::command]
async fn export_results(
    engine: tauri::State<'_, Arc<BenchmarkEngine>>,
    format: String,
) -> Result<String, String> {
    engine.export_results(&format)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let telemetry = Arc::new(GpuTelemetryEngine::new(true));
    let supervisor = Arc::new(WorkerSupervisor::new(telemetry.clone(), 32));
    let engine = Arc::new(BenchmarkEngine::new(telemetry, supervisor));

    info!("Initializing MARDUK Desktop Tauri Runtime");

    tauri::Builder::default()
        .setup(move |app| {
            app.manage(engine);

            if cfg!(debug_assertions) {
                let _ = app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                );
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            get_hardware_capabilities,
            run_benchmark,
            cancel_benchmark,
            get_benchmark_job,
            get_benchmark_history,
            get_system_rating,
            export_results
        ])
        .run(tauri::generate_context!())
        .expect("error while running MARDUK Desktop application");
}
