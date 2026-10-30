import React from 'react';
import { Cpu, Server, Layers, Zap, Clock, TrendingUp, BarChart2 } from 'lucide-react';
import { SystemTelemetry, WorkerInfo, ModelInfo, MetricsSnapshot, SchedulingDecision } from '../types';

interface OverviewTabProps {
  telemetry: SystemTelemetry | null;
  workers: WorkerInfo[];
  models: ModelInfo[];
  metrics: MetricsSnapshot | null;
  decisions: SchedulingDecision[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  telemetry,
  workers,
  models,
  metrics,
  decisions,
}) => {
  const gpuCount = telemetry?.gpus.length || 0;
  const activeWorkers = workers.filter((w) => w.status === 'healthy' || w.status === 'busy').length;
  const totalRequests = metrics?.total_requests || 0;
  const totalTokens = metrics?.total_tokens_generated || 0;
  const avgLatency = metrics?.average_latency_ms || 0;
  const rps = metrics?.requests_per_second || 0;
  const tps = metrics?.tokens_per_second || 0;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Physical GPUs</span>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{gpuCount}</span>
            <span className="text-xs text-slate-400 font-medium">NVML Device{gpuCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {telemetry?.gpus[0]
              ? `${(telemetry.gpus[0].memory_total_bytes / (1024 * 1024)).toFixed(0)} MB VRAM detected`
              : 'No hardware GPUs detected'}
          </div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Workers</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{activeWorkers}</span>
            <span className="text-xs text-emerald-400 font-medium">/ {workers.length} Total</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {workers.length === 0 ? 'No registered workers' : 'Healthy and ready for dispatch'}
          </div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Loaded Models</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{models.length}</span>
            <span className="text-xs text-cyan-400 font-medium">Cataloged</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            OpenAI-compatible registry
          </div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Latency</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{avgLatency.toFixed(1)}</span>
            <span className="text-xs text-amber-400 font-medium">ms / request</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            E2E dispatch & generation
          </div>
        </div>
      </div>

      {/* Throughput banner */}
      <div className="glass-panel p-6 border-l-4 border-l-violet-500">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Throughput (RPS)</span>
            <div className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              {rps.toFixed(2)} req/s
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Generation (TPS)</span>
            <div className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-cyan-400" />
              {tps.toFixed(2)} tok/s
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Requests Completed</span>
            <div className="text-2xl font-black text-white mt-1">{totalRequests.toLocaleString()}</div>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Tokens Produced</span>
            <div className="text-2xl font-black text-white mt-1">{totalTokens.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Two columns: GPU Mini-Overview + Recent Scheduler Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GPU Mini-Card */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              Primary GPU Hardware State
            </h3>
            <span className="text-xs text-slate-400 font-mono">NVML Live</span>
          </div>

          {telemetry?.gpus && telemetry.gpus.length > 0 ? (
            <div className="mt-5 space-y-4">
              {telemetry.gpus.map((gpu) => {
                const usedMb = gpu.memory_used_bytes / (1024 * 1024);
                const totalMb = gpu.memory_total_bytes / (1024 * 1024);
                const freeMb = gpu.memory_free_bytes / (1024 * 1024);
                const usageRatio = totalMb > 0 ? (usedMb / totalMb) * 100 : 0;

                return (
                  <div key={gpu.device_id} className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-100">GPU [{gpu.device_id}]</span>
                      <span className="font-mono text-slate-400">
                        {usedMb.toFixed(0)} MB / {totalMb.toFixed(0)} MB ({usageRatio.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill bg-gradient-to-r from-violet-500 to-indigo-500"
                        style={{ width: `${Math.min(usageRatio, 100)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                      <div>
                        <span className="text-slate-400">Free VRAM</span>
                        <div className="font-semibold text-slate-200">{freeMb.toFixed(0)} MB</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Temperature</span>
                        <div className="font-semibold text-slate-200">{gpu.temperature_celsius ?? 'N/A'} °C</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Power</span>
                        <div className="font-semibold text-slate-200">
                          {gpu.power_usage_milliwatts ? (gpu.power_usage_milliwatts / 1000).toFixed(1) : 'N/A'} W
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No physical GPUs reporting telemetry
            </div>
          )}
        </div>

        {/* Recent Decisions Feed */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Recent Intelligent Routing Decisions
            </h3>
            <span className="text-xs text-slate-400 font-mono">Latest 5</span>
          </div>

          <div className="mt-4 space-y-3">
            {decisions.slice(0, 5).map((d) => (
              <div key={d.decision_id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-200">{d.request_id}</span>
                    <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono text-[10px]">
                      {d.model}
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono">{new Date(d.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-slate-300 font-medium">
                  → Dispatched to <span className="text-emerald-400 font-semibold">{d.selected_worker_id}</span> on GPU {d.assigned_device_id}
                </div>
                <p className="text-[11px] text-slate-400 truncate">{d.rationale}</p>
              </div>
            ))}

            {decisions.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs">
                No routing decisions recorded yet. Send requests to <code className="text-violet-400">/v1/chat/completions</code>.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
