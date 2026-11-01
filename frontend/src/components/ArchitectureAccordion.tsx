import React, { useState } from 'react';
import { Layers, Cpu, ShieldCheck, Activity, ArrowRight, X, ExternalLink } from 'lucide-react';

const CLOUD_A =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093216_44218665-b15e-4566-a2d4-2676ab03609d.png';
const CLOUD_B =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093215_0f37c0c3-f82c-485b-87dd-5a35b75a8782.png';

interface ArchitectureAccordionProps {
  onOpenControlCenter?: (tab: string) => void;
}

export const ArchitectureAccordion: React.FC<ArchitectureAccordionProps> = ({
  onOpenControlCenter,
}) => {
  const [activePanel, setActivePanel] = useState<number>(0);
  const [showBlueprint, setShowBlueprint] = useState<boolean>(false);

  const panels = [
    {
      num: '01',
      numColor: '#4d6a10', // var(--olive)
      tag: 'COMPUTE BENCHMARK',
      title: 'Measure raw compute.',
      desc: 'Run repeatable CPU and supported GPU workloads. See single-thread and multi-thread CPU results alongside GPU throughput, with precision and workload details attached to every run.',
      bullets: [
        'CPU: Single-core IPC & Rayon multi-threaded tiled GEMM',
        'GPU: FP32 matrix multiplication & actual operations/sec (TFLOPS)',
        'Precision and workload dimension metadata attached to every run',
      ],
      targetTab: 'benchmarks',
      cloud: CLOUD_B,
    },
    {
      num: '02',
      numColor: '#6f9a0c', // var(--green)
      tag: 'MEMORY BANDWIDTH',
      title: 'Understand memory performance.',
      desc: 'Measure system-memory behavior and supported GPU-memory throughput. On Apple Silicon, MARDUK identifies unified memory correctly instead of inventing a separate VRAM figure.',
      bullets: [
        'System RAM: Multi-threaded STREAM-style bandwidth (GB/s)',
        'GPU VRAM: Copy, scale and triad memory throughput',
        'Built-in 20% or 2 GiB reserve to preserve OS & application headroom',
      ],
      targetTab: 'benchmarks',
      cloud: CLOUD_A,
    },
    {
      num: '03',
      numColor: '#8cae26',
      tag: 'HARDWARE ACCELERATION',
      title: 'Know which accelerators are actually available.',
      desc: 'Discover supported instruction sets and GPU acceleration paths. MARDUK reports the backend and precision used, and does not label an operation as Tensor Core work unless that execution path is verified.',
      bullets: [
        'CPU SIMD: AVX-512, AVX2, FMA3, SSE4.2, ARM NEON, AMX',
        'GPU Backends: Verified NVIDIA Tensor Cores, Apple Metal, Vulkan',
        'Numerical error & precision verification against reference matrix',
      ],
      targetTab: 'benchmarks',
      cloud: CLOUD_B,
    },
    {
      num: '04',
      numColor: '#587a14',
      tag: 'LOCAL AI INFERENCE',
      title: 'Benchmark real local inference.',
      desc: 'Use a compatible model that you have installed or explicitly chosen to download. Measure time to first token, generation throughput and latency for that model, quantization and backend combination.',
      bullets: [
        'Time to First Token (TTFT) and token generation latency (ITL)',
        'Real tokens/second execution on physical weights',
        'Honest comparison across INT4, INT8, and FP16 quantizations',
      ],
      targetTab: 'benchmarks',
      cloud: CLOUD_A,
    },
    {
      num: '05',
      numColor: '#4d6a10',
      tag: 'THERMAL & STABILITY',
      title: 'Put results in context.',
      desc: 'Observe temperature, power, clocks and throttling indicators where the operating system and hardware expose them. Short, bounded workloads help you understand behavior without turning the application into an uncontrolled burn-in tool.',
      bullets: [
        'Continuous temperature, instantaneous power, and clock telemetry',
        'Hard safety guardrail: abort immediately if core temperature exceeds 80°C',
        'Clear reporting when operating system or GPU lacks sensor access',
      ],
      targetTab: 'hardware',
      cloud: CLOUD_B,
    },
  ];

  const crates = [
    { name: 'marduk-core', role: 'Domain models, hardware detection types, benchmark parameters & metrics', icon: Layers },
    { name: 'marduk-bench', role: 'Native CPU/GPU benchmark harnesses, SIMD engines, SQLite WAL storage', icon: Cpu },
    { name: 'marduk-nvml', role: 'Zero-allocation C FFI bindings to NVML for temperature, power & clocks', icon: Activity },
    { name: 'marduk-desktop', role: 'Tauri 2 cross-platform desktop shell with typed IPC commands', icon: ShieldCheck },
    { name: 'marduk-cli', role: 'CLI binary supporting marduk bench, serve, gpus & headless CI testing', icon: ExternalLink },
  ];

  return (
    <section id="benchmarks" className="loop select-none">
      {/* Drifting Cloud with Frosted Glass Overlay (Desktop) */}
      <div
        className="loop-cloud absolute z-10 top-[4vh] -left-[4vw] w-[min(36vw,520px)] pointer-events-none hidden md:block"
        aria-hidden="true"
      >
        <div className="relative">
          <img src={CLOUD_A} alt="" className="drift-a w-full h-auto drop-shadow-sm" />
          <div
            className="glass absolute"
            style={{ left: '6%', top: '30%', width: '15%', aspectRatio: '1' }}
          />
          <div
            className="glass absolute"
            style={{ left: '23%', top: '58%', width: '13%', aspectRatio: '1' }}
          />
          <div
            className="glass absolute"
            style={{ left: '38%', top: '24%', width: '13%', aspectRatio: '1' }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="loop-head">
        <span className="pill">
          FIVE CORE BENCHMARK SUITES
        </span>
        <h2 className="h2 text-[#121410] max-w-2xl">
          From raw silicon compute<br className="hidden sm:inline" /> to real local AI inference.
        </h2>
        <button
          onClick={() => setShowBlueprint(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4d6a10] bg-[#e7efcf] hover:bg-[#d8e7ba] px-3 py-1 rounded-full transition-colors cursor-pointer mt-1"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>INSPECT MODULAR RUST ARCHITECTURE</span>
        </button>
      </div>

      {/* Accordion Track */}
      <div id="track" className="track">
        {panels.map((p, idx) => {
          const isActive = activePanel === idx;

          return (
            <div
              key={idx}
              tabIndex={0}
              role="region"
              aria-label={`Step ${idx + 1}: ${p.title}`}
              aria-expanded={isActive}
              onMouseEnter={() => setActivePanel(idx)}
              onFocus={() => setActivePanel(idx)}
              onClick={() => setActivePanel(idx)}
              className={`panel ${isActive ? 'is-active' : ''}`}
            >
              {/* Inner Content Block */}
              <div className="panel-in">
                {/* Giant Numeral */}
                <span
                  className="num"
                  style={{ color: p.numColor }}
                >
                  {p.num}
                </span>

                {/* Step Details */}
                <div className="step">
                  {/* Floating Mini Cloud on active panel */}
                  {isActive && (
                    <div className="mini-cloud hidden md:block" aria-hidden="true">
                      <img
                        src={p.cloud}
                        alt=""
                        className="drift-a w-full h-auto drop-shadow-sm pointer-events-none"
                      />
                    </div>
                  )}

                  <div className="inline-block text-[10px] font-bold tracking-wider text-[#4d6a10] uppercase mb-1.5 bg-[#e7efcf] px-2 py-0.5 rounded-full">
                    {p.tag}
                  </div>

                  <h3 className="text-xl sm:text-2xl md:text-[24px] font-medium tracking-tight text-[#121410] mb-2">
                    {p.title}
                  </h3>

                  <p className="text-sm text-[#2b2e27] leading-relaxed max-w-md mb-3">
                    {p.desc}
                  </p>

                  {/* Bullet points on active panel */}
                  <ul className="space-y-1.5 mb-4 text-xs text-[#484f42]">
                    {p.bullets.map((b, bi) => (
                      <li key={bi} className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6f9a0c] mt-1 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Link to open corresponding Control Center tab */}
                  {onOpenControlCenter && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenControlCenter(p.targetTab);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#121410] hover:text-[#4d6a10] bg-white/80 hover:bg-white border border-[#eef0ea] px-3 py-1.5 rounded-full shadow-sm transition-all"
                    >
                      <span>Inspect {p.title} Live</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Architecture Blueprint Modal */}
      {showBlueprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-[#eef0ea] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eef0ea] bg-[#f9faf7]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#b4cd52]/30 flex items-center justify-center text-[#4d6a10]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#121410]">MARDUK Workspace Architecture Blueprint</h3>
                  <p className="text-xs text-[#68705f]">Decoupled Rust Cargo Workspace & Multi-Factor Routing Engine</p>
                </div>
              </div>
              <button
                onClick={() => setShowBlueprint(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Flowchart */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4d6a10] mb-2.5">
                  Request Life-Cycle & Dataflow Pipeline
                </h4>
                <div className="p-4 rounded-xl bg-[#f4f7ee] border border-[#e2e8d5] font-mono text-xs text-[#2e3b14] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-white font-bold border border-[#d8e2ca]">HTTP Request</span>
                    <span>→ Axum Router (Tower timeouts & tracing)</span>
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <span>↓</span>
                    <span className="px-2 py-0.5 rounded bg-[#b4cd52]/40 font-bold border border-[#9ebd34]">marduk-scheduler</span>
                    <span>(Phase A: Hard Admission Pruning)</span>
                  </div>
                  <div className="flex items-center gap-2 pl-8">
                    <span>↓</span>
                    <span className="px-2 py-0.5 rounded bg-[#b4cd52]/40 font-bold border border-[#9ebd34]">marduk-scheduler</span>
                    <span>(Phase B: Quadratic VRAM Cost Scoring)</span>
                  </div>
                  <div className="flex items-center gap-2 pl-12">
                    <span>↓</span>
                    <span className="px-2 py-0.5 rounded bg-white font-bold border border-[#d8e2ca]">marduk-worker</span>
                    <span>(Supervised process dispatch + SSE Token Stream)</span>
                  </div>
                  <div className="flex items-center gap-2 pl-16">
                    <span>↓</span>
                    <span className="px-2 py-0.5 rounded bg-[#4d6a10] text-white font-bold">Physical GPU</span>
                    <span>(Real NVML continuous 100ms hardware telemetry)</span>
                  </div>
                </div>
              </div>

              {/* Mathematical Formulation */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4d6a10] mb-2">
                  Deterministic Multi-Factor Scoring Formulation
                </h4>
                <div className="p-4 rounded-xl bg-white border border-[#eef0ea] text-xs text-[#31362b] space-y-2">
                  <p className="font-mono text-sm bg-stone-50 p-2.5 rounded border border-stone-200 text-[#121410]">
                    S(W_i) = w_queue · T_wait(W_i) + w_exec · T̂_exec(W_i) + w_mem · (UsedVRAM / TotalVRAM)² + w_aff · C_reload(W_i)
                  </p>
                  <p className="text-[11px] text-[#6b7562] leading-relaxed">
                    The quadratic penalty (UsedVRAM / TotalVRAM)² exponentially discourages assigning workloads to cards nearing VRAM saturation, preventing CUDA Out-Of-Memory cascades without arbitrary hard caps.
                  </p>
                </div>
              </div>

              {/* Crate Directory Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4d6a10] mb-2.5">
                  Cargo Crate Workspace Matrix
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {crates.map((c, i) => {
                    const Icon = c.icon;
                    return (
                      <div key={i} className="p-3 rounded-lg border border-[#eef0ea] bg-white flex items-start gap-2.5">
                        <div className="p-1.5 rounded bg-[#e7efcf] text-[#4d6a10] shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-[#121410]">{c.name}</div>
                          <div className="text-[11px] text-[#555d4c] leading-snug">{c.role}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-[#eef0ea] bg-[#f9faf7] flex items-center justify-between">
              <span className="text-xs text-[#6b7562]">100% Native Rust — Zero Python runtime dependencies</span>
              <button
                onClick={() => setShowBlueprint(false)}
                className="btn text-xs h-8 px-4"
              >
                Close Blueprint
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
