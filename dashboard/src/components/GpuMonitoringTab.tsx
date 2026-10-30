import React from 'react';
import { Cpu, Thermometer, Layers, Server, Activity } from 'lucide-react';
import { SystemTelemetry } from '../types';

interface GpuMonitoringTabProps {
  telemetry: SystemTelemetry | null;
}

export const GpuMonitoringTab: React.FC<GpuMonitoringTabProps> = ({ telemetry }) => {
  const gpus = telemetry?.gpus || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-violet-400" />
            NVIDIA Physical Hardware Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real NVML hardware queries: VRAM memory, GPU core utilization, thermals, and power consumption.
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
          Poll Interval: 500ms
        </div>
      </div>

      {gpus.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-3">
          <Cpu className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-semibold text-slate-300 text-sm">No Physical NVIDIA GPUs Discovered</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            NVML is not currently detecting NVIDIA GPU hardware on this system. MARDUK is running with host CPU/RAM fallback without fabricating synthetic GPU metrics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {gpus.map((gpu) => {
            const usedMb = gpu.memory_used_bytes / (1024 * 1024);
            const totalMb = gpu.memory_total_bytes / (1024 * 1024);
            const freeMb = gpu.memory_free_bytes / (1024 * 1024);
            const vramPct = totalMb > 0 ? (usedMb / totalMb) * 100 : 0;
            const computePct = gpu.gpu_utilization_percent ?? 0;
            const memCtrlPct = gpu.memory_utilization_percent ?? 0;
            const temp = gpu.temperature_celsius;
            const powerWatts = gpu.power_usage_milliwatts ? gpu.power_usage_milliwatts / 1000 : null;
            const limitWatts = gpu.power_limit_milliwatts ? gpu.power_limit_milliwatts / 1000 : null;

            return (
              <div key={gpu.device_id} className="glass-panel p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-sm border border-violet-500/30">
                      {gpu.device_id}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">GPU Device [{gpu.device_id}]</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                        <span>Active Workers: {gpu.active_workers.length}</span>
                        <span>•</span>
                        <span>Driver: NVML Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="badge badge-healthy">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Operational
                    </span>
                  </div>
                </div>

                {/* Key Gauges Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* VRAM Progress */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-violet-400" />
                        VRAM Allocation
                      </span>
                      <span className="font-mono text-slate-400 font-bold">{vramPct.toFixed(1)}%</span>
                    </div>

                    <div className="progress-bar-bg h-3">
                      <div
                        className="progress-bar-fill bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400"
                        style={{ width: `${Math.min(vramPct, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                      <span>Used: {usedMb.toFixed(0)} MB</span>
                      <span>Free: {freeMb.toFixed(0)} MB</span>
                      <span>Total: {totalMb.toFixed(0)} MB</span>
                    </div>
                  </div>

                  {/* Compute Utilization */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        Compute Engines
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">{computePct}% Core</span>
                    </div>

                    <div className="progress-bar-bg h-3">
                      <div
                        className="progress-bar-fill bg-cyan-500"
                        style={{ width: `${Math.min(computePct, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                      <span>Memory Controller: {memCtrlPct}%</span>
                      <span>Clock: {gpu.graphics_clock_mhz ?? 'N/A'} MHz</span>
                    </div>
                  </div>

                  {/* Thermals & Power */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Thermometer className="w-4 h-4 text-amber-400" />
                        Thermals & Power
                      </span>
                      <span className="font-mono text-amber-400 font-bold">{temp !== undefined ? `${temp} °C` : 'N/A'}</span>
                    </div>

                    <div className="progress-bar-bg h-3">
                      <div
                        className={`progress-bar-fill ${
                          (temp || 0) > 80 ? 'bg-rose-500' : (temp || 0) > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(((temp || 30) / 100) * 100, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                      <span>Power: {powerWatts !== null ? `${powerWatts.toFixed(2)} W` : 'N/A'}</span>
                      <span>Limit: {limitWatts !== null ? `${limitWatts.toFixed(0)} W` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Workers List */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-violet-400" />
                    Resident Workers on this Device ({gpu.active_workers.length})
                  </h4>
                  {gpu.active_workers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {gpu.active_workers.map((wId) => (
                        <span key={wId} className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-violet-300">
                          {wId}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No workers currently mapped to device {gpu.device_id}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
