import React from 'react';
import { SystemTelemetry } from '../../api';
import { Cpu, Zap, Thermometer, HardDrive, Activity, Server } from 'lucide-react';

interface ClusterOverviewTabProps {
  telemetry: SystemTelemetry | null;
  onRefresh: () => void;
}

export const ClusterOverviewTab: React.FC<ClusterOverviewTabProps> = ({
  telemetry,
  onRefresh,
}) => {
  if (!telemetry) {
    return (
      <div className="p-8 text-center bg-white/60 rounded-2xl border border-[#eef0ea]">
        <Server className="w-10 h-10 text-neutral-400 mx-auto mb-3 animate-pulse" />
        <h3 className="text-base font-semibold text-[#121410]">Connecting to Hardware Telemetry...</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
          Waiting for response from MARDUK control plane. Ensure the server is listening on port 8080.
        </p>
        <button onClick={onRefresh} className="btn mt-4 text-xs">
          Retry Polling
        </button>
      </div>
    );
  }

  const gpus = telemetry.gpus || [];
  const hostMemoryUsedGb = (telemetry.system_memory_used_bytes / 1024 / 1024 / 1024).toFixed(1);
  const hostMemoryTotalGb = (telemetry.system_memory_total_bytes / 1024 / 1024 / 1024).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Host System Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-[#eef0ea] shadow-sm">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-[#4d6a10]" />
            Host Node
          </div>
          <div className="text-sm font-semibold text-[#121410] mt-1 truncate">
            {telemetry.hostname || 'localhost'}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">{telemetry.os_name}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#eef0ea] shadow-sm">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#4d6a10]" />
            CPU Utilization
          </div>
          <div className="text-xl font-bold text-[#121410] mt-1">
            {telemetry.cpu_usage_percent.toFixed(1)}%
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">{telemetry.cpu_count} Logical Cores</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#eef0ea] shadow-sm">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-[#4d6a10]" />
            System RAM
          </div>
          <div className="text-xl font-bold text-[#121410] mt-1">
            {hostMemoryUsedGb} <span className="text-xs font-normal text-neutral-500">/ {hostMemoryTotalGb} GB</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-[#6f9a0c] h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  (telemetry.system_memory_used_bytes / (telemetry.system_memory_total_bytes || 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#eef0ea] shadow-sm">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#4d6a10]" />
            Detected GPUs
          </div>
          <div className="text-xl font-bold text-[#121410] mt-1">
            {gpus.length} <span className="text-xs font-normal text-neutral-500">Physical Device{gpus.length === 1 ? '' : 's'}</span>
          </div>
          <div className="text-[10px] text-[#4d6a10] font-medium mt-0.5">
            {gpus.length > 0 ? 'Direct NVML telemetry' : 'No NVML hardware'}
          </div>
        </div>
      </div>

      {/* GPU Device Cards / CPU Host Profile */}
      {gpus.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#d8e2ca] shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#e7efcf] flex items-center justify-center text-[#4d6a10] mx-auto mb-3">
            <Cpu className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-[#121410]">High-Throughput CPU Host Profile Active</h4>
          <p className="text-xs text-neutral-600 mt-1 max-w-md mx-auto leading-relaxed">
            Operating in primary CPU mode. Multi-threaded AVX2/AVX-512 SIMD vectorization, RAM streaming bandwidth, and host processor benchmarks are fully active with first-class performance rating.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#121410] uppercase tracking-wider flex items-center justify-between">
            <span>Physical Accelerator Devices</span>
            <span className="text-xs font-normal text-neutral-400">
              Updated: {new Date(telemetry.timestamp).toLocaleTimeString()}
            </span>
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {gpus.map((gpu) => {
              const vramUsedMb = (gpu.memory_used_bytes / 1024 / 1024).toFixed(0);
              const vramTotalMb = (gpu.memory_total_bytes / 1024 / 1024).toFixed(0);
              const vramPct = gpu.memory_total_bytes > 0
                ? Math.round((gpu.memory_used_bytes / gpu.memory_total_bytes) * 100)
                : 0;

              return (
                <div
                  key={gpu.device_id}
                  className="p-5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm hover:border-[#b4cd52] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f4f6f0]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#e7efcf] flex items-center justify-center text-[#4d6a10]">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#121410]">
                          GPU {gpu.device_id}: NVIDIA Accelerator
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400">
                          Active Workers: {gpu.active_workers.length > 0 ? gpu.active_workers.join(', ') : 'None'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {gpu.temperature_celsius !== null && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 text-[#121410] font-medium">
                          <Thermometer className="w-3.5 h-3.5 text-neutral-500" />
                          {gpu.temperature_celsius}°C
                        </span>
                      )}
                      {gpu.power_usage_milliwatts !== null && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 text-[#121410] font-medium">
                          <Zap className="w-3.5 h-3.5 text-neutral-500" />
                          {(gpu.power_usage_milliwatts / 1000).toFixed(1)}W
                        </span>
                      )}
                    </div>
                  </div>

                  {/* VRAM Progress */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-neutral-600">VRAM Capacity & Usage</span>
                      <span className="font-semibold text-[#121410]">
                        {vramUsedMb} MB / {vramTotalMb} MB ({vramPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#6f9a0c] to-[#b4cd52] h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${vramPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Hardware Telemetry Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#f4f6f0] text-xs">
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">Compute Core</span>
                      <span className="font-semibold text-[#121410] text-sm">
                        {gpu.gpu_utilization_percent !== null ? `${gpu.gpu_utilization_percent}%` : 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">Memory Core</span>
                      <span className="font-semibold text-[#121410] text-sm">
                        {gpu.memory_utilization_percent !== null ? `${gpu.memory_utilization_percent}%` : 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">Graphics Clock</span>
                      <span className="font-semibold text-[#121410] text-sm">
                        {gpu.graphics_clock_mhz !== null ? `${gpu.graphics_clock_mhz} MHz` : 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">PCIe Bandwidth</span>
                      <span className="font-semibold text-[#121410] text-sm truncate block">
                        TX {gpu.pcie_tx_kbps ? `${(gpu.pcie_tx_kbps / 1024).toFixed(0)}MB/s` : '0'} / RX {gpu.pcie_rx_kbps ? `${(gpu.pcie_rx_kbps / 1024).toFixed(0)}MB/s` : '0'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
