export interface HealthResponse {
  status: string;
  product: string;
  version: string;
  nvml_available: boolean;
  active_workers: number;
}

export interface GpuMetrics {
  device_id: number;
  timestamp: string;
  memory_total_bytes: number;
  memory_used_bytes: number;
  memory_free_bytes: number;
  gpu_utilization_percent?: number;
  memory_utilization_percent?: number;
  temperature_celsius?: number;
  power_usage_milliwatts?: number;
  power_limit_milliwatts?: number;
  graphics_clock_mhz?: number;
  memory_clock_mhz?: number;
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

export interface WorkerInfo {
  id: string;
  name: string;
  status: 'starting' | 'healthy' | 'busy' | 'degraded' | 'stopping' | 'stopped' | 'failed';
  assigned_device_id: number;
  loaded_model?: string;
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
  worker_id: string;
  device_id: number;
  queue_depth: number;
  estimated_wait_ms: number;
  estimated_exec_ms: number;
  memory_pressure: number;
  has_model_affinity: boolean;
  final_score: number;
}

export interface DisqualificationRecord {
  worker_id: string;
  reason: string;
}

export interface SchedulingDecision {
  decision_id: string;
  request_id: string;
  model: string;
  timestamp: string;
  selected_worker_id: string;
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
