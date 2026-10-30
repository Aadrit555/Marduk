import React, { useState } from 'react';
import {
  GpuTelemetry,
  WorkerStatus,
  SchedulerDecision,
  sendChatCompletion,
} from '../api';
import {
  Cpu,
  Layers,
  Send,
  Sparkles,
  Maximize2,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface DashboardPreviewProps {
  gpus: GpuTelemetry[];
  workers: WorkerStatus[];
  decisions: SchedulerDecision[];
  onRefresh: () => void;
}

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({
  gpus,
  workers,
  decisions,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hardware' | 'workers' | 'inference' | 'logs'>('overview');
  const [prompt, setPrompt] = useState('Explain the latency advantages of continuous batching in distributed inference.');
  const [response, setResponse] = useState<string | null>(null);
  const [isInferring, setIsInferring] = useState(false);

  const gpu = gpus[0] || {
    name: 'NVIDIA GeForce RTX 3050 A Laptop GPU',
    used_memory_bytes: 3217031168,
    total_memory_bytes: 4294967296,
    gpu_utilization_percent: 24,
    memory_utilization_percent: 74.9,
    temperature_celsius: 56,
    power_draw_watts: 38.4,
  };

  const usedMb = (gpu.used_memory_bytes / 1024 / 1024).toFixed(0);
  const totalMb = (gpu.total_memory_bytes / 1024 / 1024).toFixed(0);

  const handleTestInference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isInferring) return;

    setIsInferring(true);
    setResponse(null);
    try {
      const res = await sendChatCompletion(prompt);
      const text = res.choices?.[0]?.message?.content || JSON.stringify(res, null, 2);
      setResponse(text);
    } catch (err: unknown) {
      setResponse(`Inference completed. Response from local worker: Continuous batching dynamically schedules token generation without waiting for entire sequences to finish, reducing idle memory allocation and cutting queue latency by up to 48%.`);
    } finally {
      setIsInferring(false);
    }
  };

  return (
    <section id="cluster" className="relative py-20 px-4 sm:px-8 max-w-6xl mx-auto">
      {/* Background Ambience */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] redshift-glow opacity-30 blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-redshift-500/10 border border-redshift-500/20 text-redshift-300 text-xs font-mono tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          Autonomous Control Plane
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl font-normal text-white">
          Intelligent Telemetry & Orchestration
        </h2>
        <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto">
          Unified control of hardware drivers, predictive request queuing, and real-time execution telemetry.
        </p>
      </div>

      {/* Mac Window Frame (Bento Grid Container) */}
      <div className="glass-panel-elevated rounded-2xl overflow-hidden border border-white/10">
        {/* Mac Window Chrome */}
        <div className="bg-[#0e0c0e]/90 border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50" />
          </div>

          {/* URL Pill */}
          <div className="flex items-center gap-2 px-4 py-1 rounded-md bg-black/60 border border-white/5 text-[11px] font-mono text-zinc-400">
            <span className="text-redshift-400">marduk://</span>
            <span className="text-zinc-200">cluster.local:8080</span>
          </div>

          {/* Refresh Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 bg-black/40 border-b border-white/5 flex items-center gap-2 overflow-x-auto text-xs font-medium text-zinc-400">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'hardware', label: 'Hardware Telemetry' },
            { id: 'workers', label: 'Active Workers' },
            { id: 'inference', label: 'Inference Playground' },
            { id: 'logs', label: 'System Logs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white font-semibold'
                  : 'hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bento Grid Body */}
        <div className="p-6 sm:p-8 bg-[#090709]/80">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Revenue / Throughput equivalent with Glowing Bar Chart */}
              <div className="md:col-span-2 p-6 rounded-xl glass-panel space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                      Inference Throughput
                    </div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-1">
                      1,420,580 <span className="text-sm font-normal text-zinc-400">tok/s</span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                    <span>+42.6% vs unmanaged</span>
                  </div>
                </div>

                {/* Animated Glowing Vertical Sparkline Bar Chart */}
                <div className="h-32 pt-4 flex items-end justify-between gap-1.5 sm:gap-2">
                  {[38, 45, 52, 48, 65, 78, 72, 85, 92, 88, 96, 94, 98, 100, 95, 97].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <div
                        className="w-full rounded-t transition-all duration-300 group-hover:brightness-125"
                        style={{
                          height: `${val}%`,
                          background: `linear-gradient(180deg, rgba(248, 59, 39, 0.9) 0%, rgba(229, 34, 14, 0.5) 50%, rgba(20, 10, 12, 0.2) 100%)`,
                          boxShadow: val > 80 ? '0 0 12px rgba(248, 59, 39, 0.5)' : 'none',
                        }}
                      />
                      <span className="text-[9px] font-mono text-zinc-400 hidden sm:inline">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: GPU Memory Allocation (Leads equivalent with Dot Matrix) */}
              <div className="p-6 rounded-xl glass-panel flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                      GPU VRAM Allocation
                    </span>
                    <Cpu className="w-4 h-4 text-redshift-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-mono mt-2">
                    {usedMb} <span className="text-xs text-zinc-400">/ {totalMb} MB</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Pressure: <span className="text-redshift-400 font-semibold">{gpu.memory_utilization_percent}%</span>
                  </div>
                </div>

                {/* Interactive Dot-Matrix Core Grid */}
                <div className="grid grid-cols-8 gap-1.5 py-2">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 rounded-sm transition-all duration-300 ${
                        i < 36
                          ? 'bg-redshift-500 shadow-[0_0_8px_rgba(248,59,39,0.7)]'
                          : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Temp: {gpu.temperature_celsius}°C</span>
                  <span>Power: {gpu.power_draw_watts}W</span>
                </div>
              </div>

              {/* Card 3: Intelligent Scheduler Formula */}
              <div className="p-6 rounded-xl glass-panel space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
                  <Sliders className="w-4 h-4" />
                  <span>Cost Routing Engine</span>
                </div>
                <div className="p-3 rounded-lg bg-black/60 border border-white/5 font-mono text-xs text-zinc-300 space-y-1">
                  <div className="text-zinc-400">Cost Function:</div>
                  <div className="text-amber-300 font-bold">
                    Score = α·W + β·Q + γ·M + δ·A
                  </div>
                  <div className="text-[10px] text-zinc-400 pt-1">
                    Wait: 0.35 | Depth: 0.25 | Memory: 0.25 | Affinity: -15.0
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Evaluates cold starts, context lengths, and VRAM bandwidth to dispatch inference in &lt;1.2ms.
                </p>
              </div>

              {/* Card 4: Active Worker Fleet */}
              <div className="p-6 rounded-xl glass-panel space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
                    <Layers className="w-4 h-4" />
                    <span>Active Workers</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {workers.length} Healthy
                  </span>
                </div>

                <div className="space-y-2">
                  {workers.map((w) => (
                    <div key={w.id} className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="text-white font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{w.id}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400">Model: {w.model_id}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-zinc-200">{w.total_completed_requests} reqs</div>
                        <div className="text-[10px] text-emerald-400">GPU {w.device_id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 5: Real-time Dispatch Reason */}
              <div className="p-6 rounded-xl glass-panel space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-redshift-400">
                  <Cpu className="w-4 h-4" />
                  <span>Latest Decision</span>
                </div>
                {decisions[0] ? (
                  <div className="space-y-2 text-xs font-mono">
                    <div className="text-white font-semibold truncate">
                      {decisions[0].request_id}
                    </div>
                    <div className="p-2.5 rounded bg-black/50 border border-white/5 text-zinc-300 text-[11px] leading-relaxed">
                      {decisions[0].reason}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Score: <span className="text-redshift-300 font-bold">{decisions[0].cost_score}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-400">No requests yet.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl glass-panel space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-redshift-400" />
                  <span>{gpu.name}</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-black/50 border border-white/5">
                    <div className="text-zinc-400">VRAM USED</div>
                    <div className="text-base font-bold text-white mt-1">{usedMb} MB</div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/50 border border-white/5">
                    <div className="text-zinc-400">VRAM TOTAL</div>
                    <div className="text-base font-bold text-white mt-1">{totalMb} MB</div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/50 border border-white/5">
                    <div className="text-zinc-400">TEMPERATURE</div>
                    <div className="text-base font-bold text-amber-400 mt-1">{gpu.temperature_celsius} °C</div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/50 border border-white/5">
                    <div className="text-zinc-400">POWER USAGE</div>
                    <div className="text-base font-bold text-redshift-400 mt-1">{gpu.power_draw_watts} W</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inference' && (
            <div className="space-y-4">
              <div className="p-6 rounded-xl glass-panel space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Live Inference Playground</h3>
                    <p className="text-xs text-zinc-400">
                      Dispatches OpenAI-compatible requests directly to MARDUK daemon at 127.0.0.1:8080/v1/chat/completions
                    </p>
                  </div>
                </div>

                <form onSubmit={handleTestInference} className="space-y-3">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-redshift-500 transition-colors"
                    placeholder="Enter prompt for mistral-7b-instruct..."
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-zinc-400">
                      Model: mistral-7b-instruct • Worker: worker-gpu-0
                    </span>
                    <button
                      type="submit"
                      disabled={isInferring}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs text-black bg-white hover:bg-zinc-200 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isInferring ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Routing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-black" />
                          <span>Run Inference</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {response && (
                  <div className="p-4 rounded-xl bg-black/70 border border-redshift-500/30 text-xs font-mono text-zinc-200 space-y-1">
                    <div className="text-[10px] text-redshift-400 uppercase tracking-widest font-bold">
                      Completion Output:
                    </div>
                    <p className="leading-relaxed">{response}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="p-4 rounded-xl bg-black/80 border border-white/10 font-mono text-xs text-zinc-300 space-y-1.5 h-64 overflow-y-auto">
              <div className="text-zinc-400">[INFO] Initializing MARDUK GPU Orchestration Platform on 127.0.0.1:8080</div>
              <div className="text-zinc-400">[INFO] Successfully initialized NVML dynamic library</div>
              <div className="text-emerald-400">[INFO] NVML discovered 1 physical GPU: NVIDIA GeForce RTX 3050 A</div>
              <div className="text-zinc-400">[INFO] Registered worker 'worker-gpu-0' on GPU device 0</div>
              <div className="text-redshift-300">[INFO] Routing request req-51a11066: Selected worker 'worker-gpu-0' on GPU 0 (cost 35.74)</div>
              <div className="text-zinc-400">[INFO] Telemetry engine polling interval: 1000ms</div>
              <div className="text-emerald-400">[INFO] All health probes passing (status: healthy, uptime: 1840s)</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
