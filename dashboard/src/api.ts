import {
  HealthResponse,
  SystemTelemetry,
  WorkerInfo,
  ModelInfo,
  SchedulingDecision,
  MetricsSnapshot,
} from './types';

const API_BASE = '';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSystemTelemetry(): Promise<SystemTelemetry> {
  const res = await fetch(`${API_BASE}/api/v1/gpus`);
  if (!res.ok) throw new Error(`Telemetry fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchWorkers(): Promise<WorkerInfo[]> {
  const res = await fetch(`${API_BASE}/api/v1/workers`);
  if (!res.ok) throw new Error(`Workers fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchModels(): Promise<ModelInfo[]> {
  const res = await fetch(`${API_BASE}/api/v1/models`);
  if (!res.ok) throw new Error(`Models fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSchedulerDecisions(): Promise<SchedulingDecision[]> {
  const res = await fetch(`${API_BASE}/api/v1/scheduler/decisions`);
  if (!res.ok) throw new Error(`Scheduler decisions fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchMetrics(): Promise<MetricsSnapshot> {
  const res = await fetch(`${API_BASE}/api/v1/metrics`);
  if (!res.ok) throw new Error(`Metrics fetch failed: ${res.statusText}`);
  return res.json();
}

export async function spawnWorker(worker: {
  id: string;
  name: string;
  device_id: number;
  model?: string;
  supported_models: string[];
}): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/workers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(worker),
  });
  if (!res.ok) throw new Error(`Failed to spawn worker: ${res.statusText}`);
}

export async function deleteWorker(workerId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/workers/${encodeURIComponent(workerId)}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) throw new Error(`Failed to delete worker: ${res.statusText}`);
}
