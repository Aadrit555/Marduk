// MARDUK Genuine API Client
// All telemetry, workers, models, schedulers, and inference originate from the live Rust control plane.
// No fabricated data. No fake fallbacks.

export interface GpuMetrics {
  device_id: number;
  timestamp: string;
  memory_total_bytes: number;
  memory_used_bytes: number;
  memory_free_bytes: number;
  gpu_utilization_percent: number | null;
  memory_utilization_percent: number | null;
  temperature_celsius: number | null;
  power_usage_milliwatts: number | null;
  power_limit_milliwatts: number | null;
  graphics_clock_mhz: number | null;
  memory_clock_mhz: number | null;
  pcie_tx_kbps: number | null;
  pcie_rx_kbps: number | null;
  active_workers: string[];
}

export interface SystemTelemetry {
  timestamp: string;
  hostname: string;
  os_name: string;
  cpu_count: number;
  cpu_usage_percent: number;
  system_memory_total_bytes: number;
  system_memory_used_bytes: number;
  gpus: GpuMetrics[];
}

export type WorkerOperationalStatus =
  | 'starting'
  | 'healthy'
  | 'busy'
  | 'degraded'
  | 'stopping'
  | 'stopped'
  | 'failed';

export interface WorkerInfo {
  id: string | { 0: string };
  name: string;
  status: WorkerOperationalStatus;
  assigned_device_id: number;
  loaded_model: string | null;
  supported_models: string[];
  current_queue_depth: number;
  max_queue_capacity: number;
  active_requests: number;
  total_requests_processed: number;
  total_tokens_generated: number;
  average_latency_ms: number;
  last_heartbeat: string;
  started_at: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  family: string;
  parameter_count_billions: number;
  context_window: number;
  default_quantization: string;
  estimated_vram_mb: number;
  created_at: string;
}

export interface CandidateEvaluation {
  worker_id: string | { 0: string };
  device_id: number;
  queue_depth: number;
  estimated_wait_ms: number;
  estimated_exec_ms: number;
  memory_pressure: number;
  has_model_affinity: boolean;
  final_score: number;
}

export interface DisqualificationRecord {
  worker_id: string | { 0: string };
  reason: string;
}

export interface SchedulingDecision {
  decision_id: string;
  request_id: string;
  model: string;
  timestamp: string;
  selected_worker_id: string | { 0: string };
  assigned_device_id: number;
  rationale: string;
  candidates_evaluated: CandidateEvaluation[];
  disqualified: DisqualificationRecord[];
  learned_prediction_used: boolean;
}

export interface MetricsSnapshot {
  total_requests: number;
  total_tokens_generated: number;
  active_requests: number;
  average_latency_ms: number;
  requests_per_second: number;
  tokens_per_second: number;
}

export interface LatencyDistribution {
  min_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  max_ms: number;
  mean_ms: number;
}

export interface BenchmarkResult {
  policy_name: string;
  timestamp: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_duration_secs: number;
  requests_per_second: number;
  tokens_per_second: number;
  total_tokens: number;
  latency: LatencyDistribution;
  scheduling_overhead_avg_us: number;
}

export interface BenchmarkConfig {
  concurrency: number;
  total_requests: number;
  model: string;
  max_tokens: number;
  prompt_text: string;
}

export interface HealthStatus {
  status: string;
  product: string;
  version: string;
  nvml_available: boolean;
  active_workers: number;
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Configurable API base URL with environment variable support
const getApiBase = (): string => {
  if (import.meta.env.VITE_MARDUK_API_BASE_URL) {
    return import.meta.env.VITE_MARDUK_API_BASE_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return 'http://127.0.0.1:8080';
  }
  return '';
};

export const API_BASE = getApiBase();

export function getWorkerIdStr(id: string | { 0: string }): string {
  if (typeof id === 'string') return id;
  if (id && typeof id === 'object' && '0' in id) return id['0'];
  return String(id);
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/api/v1/health`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Health check failed`);
  }
  return await res.json();
}

export async function fetchGpus(): Promise<SystemTelemetry> {
  const res = await fetch(`${API_BASE}/api/v1/gpus`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch GPU telemetry`);
  }
  return await res.json();
}

export async function fetchWorkers(): Promise<WorkerInfo[]> {
  const res = await fetch(`${API_BASE}/api/v1/workers`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch workers`);
  }
  return await res.json();
}

export async function spawnWorker(payload: {
  id: string;
  name: string;
  device_id: number;
  model?: string;
  supported_models: string[];
}): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/v1/workers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'Spawn worker failed' }));
    throw new Error(errorBody.error || `HTTP ${res.status}: Failed to spawn worker`);
  }
  return await res.json();
}

export async function deleteWorker(workerId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/workers/${encodeURIComponent(workerId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'Delete worker failed' }));
    throw new Error(errorBody.error || `HTTP ${res.status}: Failed to delete worker`);
  }
}

export async function fetchModels(): Promise<ModelInfo[]> {
  const res = await fetch(`${API_BASE}/api/v1/models`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch models`);
  }
  return await res.json();
}

export async function registerModel(model: ModelInfo): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/v1/models`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(model),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'Register model failed' }));
    throw new Error(errorBody.error || `HTTP ${res.status}: Failed to register model`);
  }
  return await res.json();
}

export async function fetchDecisions(): Promise<SchedulingDecision[]> {
  const res = await fetch(`${API_BASE}/api/v1/scheduler/decisions`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch scheduler decisions`);
  }
  return await res.json();
}

export async function fetchMetrics(): Promise<MetricsSnapshot> {
  const res = await fetch(`${API_BASE}/api/v1/metrics`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch metrics`);
  }
  return await res.json();
}

export async function fetchBenchmarks(): Promise<BenchmarkResult[]> {
  const res = await fetch(`${API_BASE}/api/v1/benchmarks`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch benchmarks`);
  }
  return await res.json();
}

export async function runBenchmark(
  config?: Partial<BenchmarkConfig>
): Promise<{ status: string; multifactor: BenchmarkResult; baseline: BenchmarkResult }> {
  const res = await fetch(`${API_BASE}/api/v1/benchmarks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config || null),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'Benchmark execution failed' }));
    throw new Error(errorBody.error || `HTTP ${res.status}: Benchmark failed`);
  }
  return await res.json();
}

export async function sendChatCompletion(
  prompt: string,
  model: string = 'mistral-7b-instruct',
  max_tokens: number = 64
): Promise<ChatCompletionResponse> {
  const res = await fetch(`${API_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens,
      temperature: 0.7,
      stream: false,
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const errorMsg =
      body?.error?.message ||
      body?.error ||
      `HTTP ${res.status}: Inference request rejected by MARDUK scheduler`;
    throw new Error(errorMsg);
  }

  return body as ChatCompletionResponse;
}

// ----------------------------------------------------
// DEDICATED GPU BENCHMARK & HARDWARE RATING SUBSYSTEM
// ----------------------------------------------------

export type BenchmarkType =
  | 'compute_core'
  | 'vram_speed'
  | 'tensor_core'
  | 'ai_inference'
  | 'thermal_stability';

export type JobStatus =
  | 'QUEUED'
  | 'PREFLIGHT'
  | 'RUNNING'
  | 'COOLING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'SAFETY_ABORTED'
  | 'UNSUPPORTED';

export interface HardwareCapabilities {
  device_id: number;
  device_name: string;
  compute_capability: string | null;
  driver_version: string | null;
  cuda_version: string | null;
  total_vram_bytes: number;
  free_vram_bytes: number;
  nvml_available: boolean;
  tensor_cores_available: boolean;
  tensor_core_generation: string | null;
  supported_precisions: string[];
  thermal_slowdown_celsius: number | null;
  power_limit_mw: number | null;
  safety_vram_reserve_bytes: number;
  max_safe_allocation_bytes: number;
}

export interface RunBenchmarkRequest {
  test_type: BenchmarkType;
  device_id?: number;
  duration_seconds?: number;
  precision?: string;
  model_id?: string;
  use_cpu?: boolean;
}

export interface BenchmarkMetrics {
  duration_ms: number;
  samples_count: number;
  start_temp_c: number | null;
  peak_temp_c: number | null;
  start_vram_used_bytes: number;
  peak_vram_used_bytes: number;
  peak_power_mw: number | null;
  avg_clock_mhz: number | null;

  achieved_tflops?: number | null;
  matrix_dim?: number | null;
  total_flops?: number | null;
  precision?: string | null;

  bandwidth_gbps?: number | null;
  allocated_bytes?: number | null;
  transferred_bytes?: number | null;

  tensor_tflops?: number | null;
  relative_error?: number | null;
  speedup_vs_fp32?: number | null;
  tensor_precision?: string | null;

  ttft_ms?: number | null;
  prompt_tokens?: number | null;
  output_tokens?: number | null;
  tokens_per_second?: number | null;
  inter_token_latency_p50_ms?: number | null;
  inter_token_latency_p95_ms?: number | null;

  temp_delta_c?: number | null;
  utilization_avg_pct?: number | null;
  throttling_events?: string[];
  stability_score_pct?: number | null;
}

export interface MardukGpuRating {
  overall_score: number | null;
  compute_score: number;
  vram_score: number;
  tensor_score: number;
  stability_score: number;
  inference_rating_note: string;
  comparability_confidence: string;
  benchmark_version: string;
  timestamp: string;
}

export interface SimdExtensions {
  sse4_2: boolean;
  avx: boolean;
  avx2: boolean;
  fma3: boolean;
  avx512f: boolean;
  neon: boolean;
  amx: boolean;
}

export interface CpuTopology {
  brand: string;
  vendor_id: string;
  architecture: string;
  physical_cores: number;
  logical_cores: number;
  frequency_mhz: number;
  simd: SimdExtensions;
  total_memory_bytes: number;
  available_memory_bytes: number;
}

export interface GpuTopology {
  device_id: number;
  device_name: string;
  uuid: string;
  vendor: string;
  compute_capability: string | null;
  driver_version: string | null;
  cuda_version: string | null;
  total_memory_bytes: number;
  free_memory_bytes: number;
  has_tensor_cores: boolean;
  tensor_core_generation: string | null;
  max_power_mw: number | null;
  thermal_limit_celsius: number;
}

export interface SystemHardwareSummary {
  os_name: string;
  os_version: string;
  hostname: string;
  cpu: CpuTopology;
  gpus: GpuTopology[];
  is_cpu_only: boolean;
  primary_device_name: string;
  timestamp: string;
}

export interface RatingBreakdown {
  cpu_single_gflops: number;
  cpu_multi_gflops: number;
  cpu_simd_speedup: number;
  cpu_ram_bandwidth_gbps: number;
  gpu_fp32_tflops: number | null;
  gpu_vram_gbps: number | null;
  gpu_tensor_tflops: number | null;
  gpu_stability_pct: number | null;
}

export interface SystemRating {
  id: string;
  timestamp: string;
  cpu_score: number;
  gpu_score: number | null;
  overall_tier: string;
  device_summary: string;
  breakdown: RatingBreakdown;
}

export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
};

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke<T>(cmd, args);
}

export interface BenchmarkJob {
  run_id: string;
  test_type: BenchmarkType;
  device_id: number;
  device_name: string;
  status: JobStatus;
  progress_percent: number;
  current_stage: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_secs: number | null;
  config: RunBenchmarkRequest;
  metrics: BenchmarkMetrics | null;
  safety_events: string[];
  failure_reason: string | null;
  rating: MardukGpuRating | null;
}

export async function fetchSystemHardware(): Promise<SystemHardwareSummary> {
  if (isTauriEnvironment()) {
    return await tauriInvoke<SystemHardwareSummary>('get_system_info');
  }
  const res = await fetch(`${API_BASE}/api/v1/benchmark/hardware`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch hardware summary`);
  }
  return await res.json();
}

export async function fetchSystemRating(): Promise<SystemRating> {
  if (isTauriEnvironment()) {
    return await tauriInvoke<SystemRating>('get_system_rating');
  }
  const res = await fetch(`${API_BASE}/api/v1/benchmark/rating`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch system rating`);
  }
  return await res.json();
}

export async function exportBenchmarkResults(format: 'json' | 'csv' = 'json'): Promise<string> {
  if (isTauriEnvironment()) {
    return await tauriInvoke<string>('export_results', { format });
  }
  const res = await fetch(`${API_BASE}/api/v1/benchmark/export?format=${format}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to export benchmark results`);
  }
  return await res.text();
}

export async function fetchBenchmarkCapabilities(): Promise<HardwareCapabilities> {
  if (isTauriEnvironment()) {
    return await tauriInvoke<HardwareCapabilities>('get_hardware_capabilities');
  }
  const res = await fetch(`${API_BASE}/api/v1/benchmark/capabilities`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch hardware capabilities`);
  }
  return await res.json();
}

export async function fetchBenchmarkHistory(): Promise<BenchmarkJob[]> {
  if (isTauriEnvironment()) {
    return await tauriInvoke<BenchmarkJob[]>('get_benchmark_history');
  }
  const res = await fetch(`${API_BASE}/api/v1/benchmark/history`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch benchmark history`);
  }
  return await res.json();
}

export async function fetchBenchmarkJob(runId: string): Promise<BenchmarkJob> {
  if (isTauriEnvironment()) {
    const job = await tauriInvoke<BenchmarkJob | null>('get_benchmark_job', { runId });
    if (!job) throw new Error(`Benchmark job ${runId} not found`);
    return job;
  }
  const res = await fetch(`${API_BASE}/api/v1/benchmark/${runId}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Benchmark job ${runId} not found`);
  }
  return await res.json();
}

export async function submitBenchmarkJob(
  req: RunBenchmarkRequest
): Promise<{ run_id: string; message: string; status: string }> {
  if (isTauriEnvironment()) {
    const run_id = await tauriInvoke<string>('run_benchmark', { req });
    return { run_id, message: 'Benchmark job submitted', status: 'submitted' };
  }
  const res = await fetch(`${API_BASE}/api/v1/benchmark/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error || `HTTP ${res.status}: Benchmark job submission failed`);
  }
  return body;
}

export async function cancelBenchmarkJob(
  runId: string
): Promise<{ run_id: string; message: string; status: string }> {
  if (isTauriEnvironment()) {
    await tauriInvoke('cancel_benchmark', { runId });
    return { run_id: runId, message: 'Cancellation dispatched', status: 'cancelled' };
  }
  const res = await fetch(`${API_BASE}/api/v1/benchmark/${runId}/cancel`, {
    method: 'POST',
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error || `HTTP ${res.status}: Cancellation failed`);
  }
  return body;
}
