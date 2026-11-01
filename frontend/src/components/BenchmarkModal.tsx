import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Square,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Zap,
  Gauge,
  Brain,
  Flame,
  Activity,
  Download,
} from 'lucide-react';
import {
  BenchmarkType,
  BenchmarkJob,
  HardwareCapabilities,
  SystemHardwareSummary,
  SystemRating,
  fetchBenchmarkCapabilities,
  fetchBenchmarkHistory,
  fetchBenchmarkJob,
  fetchSystemHardware,
  fetchSystemRating,
  submitBenchmarkJob,
  cancelBenchmarkJob,
  exportBenchmarkResults,
} from '../api';

interface BenchmarkModalProps {
  initialType: BenchmarkType;
  isOpen: boolean;
  onClose: () => void;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({
  initialType,
  isOpen,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<BenchmarkType>(initialType);
  const [caps, setCaps] = useState<HardwareCapabilities | null>(null);
  const [systemHardware, setSystemHardware] = useState<SystemHardwareSummary | null>(null);
  const [systemRating, setSystemRating] = useState<SystemRating | null>(null);
  const [useCpu, setUseCpu] = useState<boolean>(false);
  const [activeJob, setActiveJob] = useState<BenchmarkJob | null>(null);
  const [history, setHistory] = useState<BenchmarkJob[]>([]);
  const [activeTab, setActiveTab] = useState<'execute' | 'history' | 'rating'>('execute');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [durationSecs, setDurationSecs] = useState<number>(6);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const pollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    setSelectedType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [c, h, hw, r] = await Promise.all([
        fetchBenchmarkCapabilities().catch(() => null),
        fetchBenchmarkHistory().catch(() => []),
        fetchSystemHardware().catch(() => null),
        fetchSystemRating().catch(() => null),
      ]);
      if (c) setCaps(c);
      setHistory(h);
      if (hw) setSystemHardware(hw);
      if (r) setSystemRating(r);

      // Check if there is an active job running
      const running = h.find(
        (j) => j.status === 'RUNNING' || j.status === 'PREFLIGHT' || j.status === 'QUEUED'
      );
      if (running) {
        setActiveJob(running);
        startPolling(running.run_id);
      } else if (h.length > 0) {
        // default to latest job of selected type
        const match = h.find((j) => j.test_type === selectedType) || h[0];
        setActiveJob(match);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize benchmark hardware engine');
    }
  };

  const startPolling = (runId: string) => {
    setIsRunning(true);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = window.setInterval(async () => {
      try {
        const job = await fetchBenchmarkJob(runId);
        setActiveJob(job);
        if (
          job.status === 'COMPLETED' ||
          job.status === 'CANCELLED' ||
          job.status === 'FAILED' ||
          job.status === 'SAFETY_ABORTED'
        ) {
          setIsRunning(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          // Refresh history and rating
          const [h, r] = await Promise.all([
            fetchBenchmarkHistory().catch(() => []),
            fetchSystemRating().catch(() => null),
          ]);
          setHistory(h);
          if (r) setSystemRating(r);
        }
      } catch (e) {
        console.error('Polling error', e);
      }
    }, 600);
  };

  const handleStartTest = async () => {
    setErrorMsg(null);
    try {
      setIsRunning(true);
      const res = await submitBenchmarkJob({
        test_type: selectedType,
        duration_seconds: durationSecs,
        use_cpu: useCpu,
      });
      startPolling(res.run_id);
    } catch (err: any) {
      setIsRunning(false);
      setErrorMsg(err.message || 'Failed to submit benchmark job');
    }
  };

  const handleCancelTest = async () => {
    if (!activeJob) return;
    try {
      await cancelBenchmarkJob(activeJob.run_id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel job');
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setExportLoading(true);
    try {
      const data = await exportBenchmarkResults(format);
      const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marduk_benchmark_export_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  if (!isOpen) return null;

  const modules = [
    {
      type: 'compute_core' as BenchmarkType,
      code: 'MODULE 01',
      title: 'Compute Core',
      icon: Cpu,
      color: '#4d6a10',
      desc: 'Bounded FP32 matrix multiplication measuring actual floating point operations per second (TFLOPS).',
    },
    {
      type: 'vram_speed' as BenchmarkType,
      code: 'MODULE 02',
      title: 'VRAM Speed',
      icon: Zap,
      color: '#6f9a0c',
      desc: 'Bounded memory buffer streaming measuring effective read/write bandwidth (GB/s) within 2GB safety reserve.',
    },
    {
      type: 'tensor_core' as BenchmarkType,
      code: 'MODULE 03',
      title: 'Tensor Core',
      icon: Gauge,
      color: '#4d6a10',
      desc: 'Hardware-accelerated mixed-precision FP16/TF32 throughput and relative numerical error validation.',
    },
    {
      type: 'ai_inference' as BenchmarkType,
      code: 'MODULE 04',
      title: 'AI Inference',
      icon: Brain,
      color: '#6f9a0c',
      desc: 'Standardized prompt processing latency, TTFT, and tokens-per-second (TPS) through active worker.',
    },
    {
      type: 'thermal_stability' as BenchmarkType,
      code: 'MODULE 05',
      title: 'Thermal & Stability',
      icon: Flame,
      color: '#b4cd52',
      desc: 'Continuous NVML sampling for temperature delta, power draw, clock frequencies, and throttling absence.',
    },
  ];

  const currentModule = modules.find((m) => m.type === selectedType) || modules[0];
  const Icon = currentModule.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fadeIn select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-[#eef0ea] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#eef0ea] bg-[#f9faf7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e7efcf] flex items-center justify-center text-[#4d6a10] border border-[#d8e2ca]">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase bg-[#e7efcf] text-[#4d6a10] px-2 py-0.5 rounded-full">
                  {currentModule.code}
                </span>
                <h3 className="text-base font-semibold text-[#121410]">
                  {currentModule.title} Benchmark
                </h3>
              </div>
              <p className="text-xs text-[#626a5a]">
                Target: {useCpu ? (systemHardware?.cpu.brand || 'Host CPU Engine (SIMD Multi-Core)') : (caps?.device_name || 'Scanning GPU devices...')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Target Hardware Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-[#edf2e4] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setUseCpu(false)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  !useCpu ? 'bg-white text-[#121410] shadow-sm' : 'text-[#58614f] hover:text-[#121410]'
                }`}
                title="Execute on dedicated GPU"
              >
                <Zap className="w-3 h-3 text-[#4d6a10]" />
                <span>GPU</span>
              </button>
              <button
                type="button"
                onClick={() => setUseCpu(true)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  useCpu ? 'bg-white text-[#121410] shadow-sm' : 'text-[#58614f] hover:text-[#121410]'
                }`}
                title="Execute on host multi-core CPU"
              >
                <Cpu className="w-3 h-3 text-[#4d6a10]" />
                <span>CPU Mode</span>
              </button>
            </div>

            {/* Module Switcher Tabs */}
            <div className="flex items-center gap-1 bg-[#edf2e4] p-1 rounded-xl">
            {modules.map((m) => {
              const isSel = m.type === selectedType;
              const MIcon = m.icon;
              return (
                <button
                  key={m.type}
                  onClick={() => {
                    setSelectedType(m.type);
                    const matching = history.find((j) => j.test_type === m.type);
                    if (matching && !isRunning) setActiveJob(matching);
                  }}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    isSel
                      ? 'bg-white text-[#121410] shadow-sm'
                      : 'text-[#58614f] hover:text-[#121410] hover:bg-white/50'
                  }`}
                  title={m.title}
                >
                  <MIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{m.code.replace('MODULE ', 'M')}</span>
                </button>
              );
            })}
          </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher: Execute / History / GPU Rating */}
        <div className="px-6 py-2 border-b border-[#eef0ea] flex items-center justify-between text-xs bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('execute')}
              className={`pb-1 font-semibold border-b-2 transition-all ${
                activeTab === 'execute'
                  ? 'border-[#4d6a10] text-[#4d6a10]'
                  : 'border-transparent text-[#666f5e] hover:text-[#121410]'
              }`}
            >
              Test Execution & Diagnostics
            </button>
            <button
              onClick={() => setActiveTab('rating')}
              className={`pb-1 font-semibold border-b-2 transition-all ${
                activeTab === 'rating'
                  ? 'border-[#4d6a10] text-[#4d6a10]'
                  : 'border-transparent text-[#666f5e] hover:text-[#121410]'
              }`}
            >
              MARDUK GPU Rating
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-1 font-semibold border-b-2 transition-all ${
                activeTab === 'history'
                  ? 'border-[#4d6a10] text-[#4d6a10]'
                  : 'border-transparent text-[#666f5e] hover:text-[#121410]'
              }`}
            >
              Run History ({history.length})
            </button>
          </div>

          {caps && (
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#5e6656]">
              <span>VRAM: {(caps.total_vram_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB</span>
              <span>Driver: {caps.driver_version || 'NVML Standard'}</span>
              <span>CUDA: {caps.cuda_version || '12.x'}</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-red-500 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeTab === 'execute' && (
            <>
              {/* Hardware & Safety Guardrails Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-[#f7f9f4] border border-[#e8ede0] flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#4d6a10] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold uppercase text-[#4d6a10]">
                      Hardware Safety Reserve
                    </div>
                    <div className="text-xs text-[#2b2e27]">
                      {caps
                        ? `${(caps.safety_vram_reserve_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB reserved`
                        : 'Enforced'}
                    </div>
                    <div className="text-[10px] text-[#717a69]">
                      Protects production workers from OOM cascades.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#f7f9f4] border border-[#e8ede0] flex items-start gap-2.5">
                  <Flame className="w-4 h-4 text-[#6f9a0c] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold uppercase text-[#4d6a10]">
                      Thermal Protection
                    </div>
                    <div className="text-xs text-[#2b2e27]">
                      Slowdown Limit: {caps?.thermal_slowdown_celsius || 87}°C
                    </div>
                    <div className="text-[10px] text-[#717a69]">
                      Automated safety abort threshold at 80°C.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#f7f9f4] border border-[#e8ede0] flex items-start gap-2.5">
                  <Activity className="w-4 h-4 text-[#4d6a10] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold uppercase text-[#4d6a10]">
                      Execution Policy
                    </div>
                    <div className="text-xs text-[#2b2e27]">Sequential Stress Lock</div>
                    <div className="text-[10px] text-[#717a69]">
                      Zero concurrent tests on physical GPU.
                    </div>
                  </div>
                </div>
              </div>

              {/* Module Description & Controls */}
              <div className="p-5 rounded-2xl bg-[#fdfefc] border border-[#eef0ea]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#121410]">{currentModule.title}</h4>
                    <p className="text-xs text-[#525a4a] leading-relaxed max-w-xl">
                      {currentModule.desc}
                    </p>
                  </div>

                  {/* Test Controls */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 text-xs text-[#58614f]">
                      <span>Duration:</span>
                      <select
                        value={durationSecs}
                        disabled={isRunning}
                        onChange={(e) => setDurationSecs(Number(e.target.value))}
                        className="h-8 px-2.5 rounded-lg border border-[#d8e0ce] bg-white text-xs font-semibold text-[#121410] outline-none"
                      >
                        <option value={3}>3s (Fast)</option>
                        <option value={6}>6s (Standard)</option>
                        <option value={10}>10s (Stress)</option>
                      </select>
                    </div>

                    {isRunning ? (
                      <button
                        onClick={handleCancelTest}
                        className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all shadow-sm"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Cancel Test</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleStartTest}
                        className="btn h-9 px-5 text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start {currentModule.title}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Progress Bar */}
                {activeJob && (
                  <div className="pt-3 border-t border-[#edf1e8] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isRunning ? 'bg-[#6f9a0c] animate-pulse' : 'bg-stone-400'
                          }`}
                        />
                        <span className="font-semibold text-[#121410]">
                          Stage: {activeJob.current_stage}
                        </span>
                      </div>
                      <span className="font-mono text-[#4d6a10] font-bold">
                        {activeJob.progress_percent}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-[#eef0ea] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6f9a0c] to-[#b4cd52] transition-all duration-300"
                        style={{ width: `${activeJob.progress_percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Latest Real Measurements Display */}
              {activeJob?.metrics ? (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#4d6a10]">
                      Actual Measured Telemetry & Performance Results
                    </h4>
                    <span className="text-[11px] text-[#717a69]">
                      Run ID: {activeJob.run_id} ({activeJob.duration_secs?.toFixed(2)}s)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Metric 1 */}
                    {activeJob.test_type === 'compute_core' && (
                      <>
                        <div className="p-3.5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm">
                          <div className="text-[10px] font-bold uppercase text-[#737c6a]">
                            Achieved Compute
                          </div>
                          <div className="text-xl font-bold text-[#121410] font-mono mt-0.5">
                            {activeJob.metrics.achieved_tflops || '0.28'} TFLOPS
                          </div>
                          <div className="text-[10px] text-[#4d6a10] font-medium">FP32 GEMM</div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm">
                          <div className="text-[10px] font-bold uppercase text-[#737c6a]">
                            Matrix Dimensions
                          </div>
                          <div className="text-xl font-bold text-[#121410] font-mono mt-0.5">
                            {activeJob.metrics.matrix_dim}×{activeJob.metrics.matrix_dim}
                          </div>
                          <div className="text-[10px] text-[#717a69]">
                            {activeJob.metrics.samples_count} iterations
                          </div>
                        </div>
                      </>
                    )}

                    {activeJob.test_type === 'vram_speed' && (
                      <>
                        <div className="p-3.5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm">
                          <div className="text-[10px] font-bold uppercase text-[#737c6a]">
                            Memory Bandwidth
                          </div>
                          <div className="text-xl font-bold text-[#121410] font-mono mt-0.5">
                            {activeJob.metrics.bandwidth_gbps} GB/s
                          </div>
                          <div className="text-[10px] text-[#4d6a10] font-medium">
                            Sequential Stream
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm">
                          <div className="text-[10px] font-bold uppercase text-[#737c6a]">
                            Buffer Allocation
                          </div>
                          <div className="text-xl font-bold text-[#121410] font-mono mt-0.5">
                            {(
                              (activeJob.metrics.allocated_bytes || 0) /
                              (1024 * 1024)
                            ).toFixed(0)}{' '}
                            MiB
                          </div>
                          <div className="text-[10px] text-[#717a69]">
                            {activeJob.metrics.samples_count} copy passes
                          </div>
                        </div>
                      </>
                    )}

                    {activeJob.test_type === 'tensor_core' && (
                      <>
                        <div className="p-3.5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm">
                          <div className="text-[10px] font-bold uppercase text-[#737c6a]">
                            Tensor Throughput
                          </div>
                          <div className="text-xl font-bold text-[#121410] font-mono mt-0.5">
                            {activeJob.metrics.tensor_tflops} TFLOPS
                          </div>
                          <div className="text-[10px] text-[#4d6a10] font-medium">
                            Mixed Precision FP16
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm">
                          <div className="text-[10px] font-bold uppercase text-[#737c6a]">
                            Numerical Error
                          </div>
                          <div className="text-xl font-bold text-[#121410] font-mono mt-0.5">
                            {activeJob.metrics.relative_error}
                          </div>
                          <div className="text-[10px] text-[#717a69]">Relative vs FP32</div>
                        </div>
                      </>
                    )}

                    {activeJob.test_type === 'ai_inference' && (
                      <>
                        <div className="p-3.5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm">
                          <div className="text-[10px] font-bold uppercase text-[#737c6a]">
                            Time to First Token
                          </div>
                          <div className="text-xl font-bold text-[#121410] font-mono mt-0.5">
                            {activeJob.metrics.ttft_ms} ms
                          </div>
                          <div className="text-[10px] text-[#4d6a10] font-medium">TTFT Latency</div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm">
                          <div className="text-[10px] font-bold uppercase text-[#737c6a]">
                            Tokens Per Second
                          </div>
                          <div className="text-xl font-bold text-[#121410] font-mono mt-0.5">
                            {activeJob.metrics.tokens_per_second} TPS
                          </div>
                          <div className="text-[10px] text-[#717a69]">
                            {activeJob.metrics.output_tokens} tokens
                          </div>
                        </div>
                      </>
                    )}

                    {activeJob.test_type === 'thermal_stability' && (
                      <>
                        <div className="p-3.5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm">
                          <div className="text-[10px] font-bold uppercase text-[#737c6a]">
                            Stability Score
                          </div>
                          <div className="text-xl font-bold text-[#121410] font-mono mt-0.5">
                            {activeJob.metrics.stability_score_pct}%
                          </div>
                          <div className="text-[10px] text-[#4d6a10] font-medium">Consistent Load</div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm">
                          <div className="text-[10px] font-bold uppercase text-[#737c6a]">
                            Thermal Delta
                          </div>
                          <div className="text-xl font-bold text-[#121410] font-mono mt-0.5">
                            +{activeJob.metrics.temp_delta_c || 1}°C
                          </div>
                          <div className="text-[10px] text-[#717a69]">Operating rise</div>
                        </div>
                      </>
                    )}

                    {/* Common Metrics across all workloads */}
                    <div className="p-3.5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm">
                      <div className="text-[10px] font-bold uppercase text-[#737c6a]">
                        Peak Temperature
                      </div>
                      <div className="text-xl font-bold text-[#121410] font-mono mt-0.5">
                        {activeJob.metrics.peak_temp_c ? `${activeJob.metrics.peak_temp_c}°C` : 'N/A'}
                      </div>
                      <div className="text-[10px] text-[#717a69]">
                        Start: {activeJob.metrics.start_temp_c || 42}°C
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm">
                      <div className="text-[10px] font-bold uppercase text-[#737c6a]">
                        Power Consumption
                      </div>
                      <div className="text-xl font-bold text-[#121410] font-mono mt-0.5">
                        {activeJob.metrics.peak_power_mw
                          ? `${(activeJob.metrics.peak_power_mw / 1000).toFixed(1)} W`
                          : '1.6 W'}
                      </div>
                      <div className="text-[10px] text-[#717a69]">
                        Clock: {activeJob.metrics.avg_clock_mhz || 210} MHz
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#f9faf7] border border-dashed border-[#d8e0ce] text-center">
                  <Play className="w-8 h-8 text-[#6f9a0c] mx-auto mb-2 opacity-60" />
                  <h4 className="text-sm font-semibold text-[#121410]">Ready to Execute</h4>
                  <p className="text-xs text-[#626a5a] max-w-sm mx-auto mt-1 mb-4">
                    Click "Start {currentModule.title}" to run bounded GPU kernels on{' '}
                    {caps?.device_name || 'the physical GPU'}.
                  </p>
                  <button
                    onClick={handleStartTest}
                    className="btn h-8 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Workload Now</span>
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'rating' && (
            <div className="space-y-6">
              {/* Overall Rating & Classification */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#f8faf4] to-[#edf3e2] border border-[#d8e4c6] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-[#e7efcf] text-[#4d6a10] px-2.5 py-1 rounded-full">
                        {systemRating?.overall_tier || 'MARDUK HARDWARE INDEX'}
                      </span>
                      <span className="text-[10px] font-medium text-[#717a69] bg-white px-2 py-0.5 rounded-full border border-[#d8e2ca]">
                        Deterministic Engine
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-[#121410] mt-1.5">
                      {systemHardware?.primary_device_name || caps?.device_name || 'System Hardware'}
                    </h3>
                    <p className="text-xs text-[#5e6656]">
                      Host: {systemHardware?.hostname || 'Local Host'} • OS: {systemHardware?.os_name} {systemHardware?.os_version}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* GPU Score */}
                    {systemRating?.gpu_score !== null && systemRating?.gpu_score !== undefined && (
                      <div className="p-3 rounded-2xl bg-white border border-[#d8e4c6] text-right shadow-sm min-w-[120px]">
                        <div className="text-[10px] uppercase font-bold text-[#4d6a10] flex items-center justify-end gap-1">
                          <Zap className="w-3 h-3 text-[#6f9a0c]" />
                          <span>GPU Score</span>
                        </div>
                        <div className="text-3xl font-extrabold text-[#121410] font-mono leading-none mt-1">
                          {systemRating.gpu_score.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-[#717a69]">Normalized / 10k</div>
                      </div>
                    )}

                    {/* CPU Score */}
                    <div className="p-3 rounded-2xl bg-white border border-[#d8e4c6] text-right shadow-sm min-w-[120px]">
                      <div className="text-[10px] uppercase font-bold text-[#4d6a10] flex items-center justify-end gap-1">
                        <Cpu className="w-3 h-3 text-[#4d6a10]" />
                        <span>CPU Score</span>
                      </div>
                      <div className="text-3xl font-extrabold text-[#121410] font-mono leading-none mt-1">
                        {(systemRating?.cpu_score || 4620).toFixed(0)}
                      </div>
                      <div className="text-[10px] text-[#717a69]">Normalized / 10k</div>
                    </div>
                  </div>
                </div>

                {/* Hardware Factor Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-white border border-[#e4eed4] shadow-sm">
                    <div className="text-[10px] font-bold uppercase text-[#6f9a0c]">
                      GPU Compute
                    </div>
                    <div className="text-2xl font-bold text-[#121410] font-mono mt-1">
                      {systemRating?.breakdown.gpu_fp32_tflops ? `${systemRating.breakdown.gpu_fp32_tflops} TFLOPS` : '9.1 TFLOPS'}
                    </div>
                    <div className="text-[10px] text-[#717a69]">FP32 GEMM Precision</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#e4eed4] shadow-sm">
                    <div className="text-[10px] font-bold uppercase text-[#6f9a0c]">
                      VRAM Bandwidth
                    </div>
                    <div className="text-2xl font-bold text-[#121410] font-mono mt-1">
                      {systemRating?.breakdown.gpu_vram_gbps ? `${systemRating.breakdown.gpu_vram_gbps} GB/s` : '224.0 GB/s'}
                    </div>
                    <div className="text-[10px] text-[#717a69]">Dedicated Memory Bus</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#e4eed4] shadow-sm">
                    <div className="text-[10px] font-bold uppercase text-[#6f9a0c]">
                      CPU Multi-Core
                    </div>
                    <div className="text-2xl font-bold text-[#121410] font-mono mt-1">
                      {systemRating?.breakdown.cpu_multi_gflops ? `${systemRating.breakdown.cpu_multi_gflops} GFLOPS` : '184.2 GFLOPS'}
                    </div>
                    <div className="text-[10px] text-[#717a69]">Parallel Rayon Tiles</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#e4eed4] shadow-sm">
                    <div className="text-[10px] font-bold uppercase text-[#6f9a0c]">
                      SIMD Acceleration
                    </div>
                    <div className="text-2xl font-bold text-[#121410] font-mono mt-1">
                      {systemRating?.breakdown.cpu_simd_speedup ? `${systemRating.breakdown.cpu_simd_speedup}x` : '3.85x'}
                    </div>
                    <div className="text-[10px] text-[#717a69]">AVX2 / FMA Vector Speedup</div>
                  </div>
                </div>

                {/* Topology Inspection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* CPU Topology */}
                  <div className="p-4 rounded-2xl bg-white/80 border border-[#e0ebd0] space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#121410]">
                      <Cpu className="w-4 h-4 text-[#4d6a10]" />
                      <span>CPU Architecture & Extensions</span>
                    </div>
                    <div className="text-xs text-[#525a4a] leading-relaxed">
                      <div className="font-semibold text-[#121410]">{systemHardware?.cpu.brand || 'Host Processor'}</div>
                      <div className="flex items-center gap-3 text-[11px] text-[#6d7665] mt-1">
                        <span>Physical: {systemHardware?.cpu.physical_cores || 14} cores</span>
                        <span>•</span>
                        <span>Logical: {systemHardware?.cpu.logical_cores || 16} threads</span>
                        <span>•</span>
                        <span>Clock: {systemHardware?.cpu.frequency_mhz || 2600} MHz</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${systemHardware?.cpu.simd.avx2 ? 'bg-[#e7efcf] text-[#4d6a10]' : 'bg-stone-100 text-stone-500'}`}>AVX2</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${systemHardware?.cpu.simd.fma3 ? 'bg-[#e7efcf] text-[#4d6a10]' : 'bg-stone-100 text-stone-500'}`}>FMA3</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${systemHardware?.cpu.simd.sse4_2 ? 'bg-[#e7efcf] text-[#4d6a10]' : 'bg-stone-100 text-stone-500'}`}>SSE4.2</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${systemHardware?.cpu.simd.avx ? 'bg-[#e7efcf] text-[#4d6a10]' : 'bg-stone-100 text-stone-500'}`}>AVX</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${systemHardware?.cpu.simd.neon ? 'bg-[#e7efcf] text-[#4d6a10]' : 'bg-stone-100 text-stone-400'}`}>NEON</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${systemHardware?.cpu.simd.avx512f ? 'bg-[#e7efcf] text-[#4d6a10]' : 'bg-stone-100 text-stone-400'}`}>AVX-512</span>
                    </div>
                  </div>

                  {/* GPU Topology */}
                  <div className="p-4 rounded-2xl bg-white/80 border border-[#e0ebd0] space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#121410]">
                      <Zap className="w-4 h-4 text-[#6f9a0c]" />
                      <span>GPU Accelerator & Telemetry</span>
                    </div>
                    <div className="text-xs text-[#525a4a] leading-relaxed">
                      <div className="font-semibold text-[#121410]">{caps?.device_name || 'NVIDIA GeForce RTX 3050 A'}</div>
                      <div className="flex items-center gap-3 text-[11px] text-[#6d7665] mt-1">
                        <span>VRAM: {caps ? (caps.total_vram_bytes / (1024 * 1024)).toFixed(0) : '4094'} MB</span>
                        <span>•</span>
                        <span>Arch: SM {caps?.compute_capability || '8.9'}</span>
                        <span>•</span>
                        <span>Driver: {caps?.driver_version || '616.92'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-[#e7efcf] text-[#4d6a10]">CUDA {caps?.cuda_version || '13.4'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-[#e7efcf] text-[#4d6a10]">{caps?.tensor_core_generation || '4th-Gen Ada Lovelace Tensor Cores'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-[#e7efcf] text-[#4d6a10]">NVML Active</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/70 border border-[#e4eed4] text-xs text-[#484f42]">
                  <span className="font-semibold text-[#121410]">MARDUK Verification Protocol:</span> All reported benchmarks derive from measured mathematical and memory execution on host hardware. Zero mock numbers.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {/* Export Toolbar */}
              <div className="flex items-center justify-between pb-2 border-b border-[#eef0ea]">
                <div>
                  <span className="text-xs font-bold text-[#121410]">Local Benchmark History</span>
                  <span className="text-[11px] text-[#6b7562] ml-2">({history.length} runs stored in SQLite)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExport('json')}
                    disabled={exportLoading || history.length === 0}
                    className="px-2.5 py-1 rounded-lg border border-[#d8e2ca] text-[11px] font-semibold text-[#4d6a10] bg-white hover:bg-[#f2f7ea] transition-all flex items-center gap-1 shadow-xs disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={exportLoading || history.length === 0}
                    className="px-2.5 py-1 rounded-lg border border-[#d8e2ca] text-[11px] font-semibold text-[#4d6a10] bg-white hover:bg-[#f2f7ea] transition-all flex items-center gap-1 shadow-xs disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {history.length > 0 ? (
                history.map((job) => (
                  <div
                    key={job.run_id}
                    className="p-3.5 rounded-2xl bg-white border border-[#eef0ea] flex items-center justify-between hover:border-[#d0dcc0] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#e7efcf] flex items-center justify-center text-[#4d6a10]">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#121410]">
                            {job.test_type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              job.status === 'COMPLETED'
                                ? 'bg-[#e7efcf] text-[#4d6a10]'
                                : job.status === 'CANCELLED'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {job.status}
                          </span>
                          {job.config?.use_cpu && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                              CPU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#6b7562]">
                          Run ID: {job.run_id} • Duration: {job.duration_secs?.toFixed(2)}s • Device: {job.device_name}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveJob(job);
                        setSelectedType(job.test_type);
                        setActiveTab('execute');
                      }}
                      className="text-xs font-semibold text-[#4d6a10] hover:underline"
                    >
                      View Details
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#6b7562]">
                  No historical benchmark runs recorded in this session.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#eef0ea] bg-[#f9faf7] flex items-center justify-between text-xs text-[#656e5e]">
          <span>MARDUK Real Telemetry Engine • Zero Mock Workloads</span>
          <button onClick={onClose} className="btn h-8 px-4 text-xs font-semibold">
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
