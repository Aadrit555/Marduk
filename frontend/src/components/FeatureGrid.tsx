import React from 'react';
import { Cpu, Zap, Layers, ShieldCheck, ArrowRight } from 'lucide-react';

interface FeatureGridProps {
  onOpenDashboard: () => void;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({ onOpenDashboard }) => {
  return (
    <section id="scheduler" className="relative py-24 px-6 max-w-6xl mx-auto">
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-redshift-500/10 border border-redshift-500/20 text-redshift-300 text-xs font-mono tracking-wider uppercase">
          <ShieldCheck className="w-3.5 h-3.5" />
          Engineered for Zero Failure
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl font-normal text-white">
          Architected for Sovereign GPU Clouds
        </h2>
        <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
          Every sub-system designed for extreme throughput, explainable routing, and deterministic low-latency execution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 01 */}
        <div className="p-8 rounded-2xl glass-panel hover:border-redshift-500/40 transition-all duration-300 group space-y-5">
          <div className="text-xs font-mono font-bold text-redshift-400 tracking-wider">
            01 — HARDWARE TELEMETRY
          </div>
          <div className="w-12 h-12 rounded-xl bg-redshift-500/10 text-redshift-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-redshift-500/10">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-redshift-200 transition-colors">
            Native NVML Dynamic Binding
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Directly binds to libnvidia-ml.so / nvml.dll with zero synthetic approximations. Captures VRAM allocation, temperature, and thermal throttles in real-time.
          </p>
        </div>

        {/* Pillar 02 */}
        <div className="p-8 rounded-2xl glass-panel hover:border-amber-500/40 transition-all duration-300 group space-y-5">
          <div className="text-xs font-mono font-bold text-amber-400 tracking-wider">
            02 — PREDICTIVE ROUTING
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/10">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-amber-200 transition-colors">
            Learned Ridge Latency Prediction
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Multi-factor cost optimization engine combining queue depths, cold-start model weights, and context lengths to route inference with &lt;1.2ms latency overhead.
          </p>
        </div>

        {/* Pillar 03 */}
        <div className="p-8 rounded-2xl glass-panel hover:border-cyan-500/40 transition-all duration-300 group space-y-5">
          <div className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
            03 — WORKER ISOLATION
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/10">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-cyan-200 transition-colors">
            Autonomous Process Supervision
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Sub-process isolation, active health check probes, automatic CUDA OOM recovery, and immediate failover to redundant worker nodes.
          </p>
        </div>
      </div>

      <div className="mt-14 text-center">
        <button
          onClick={onOpenDashboard}
          className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full font-semibold text-xs tracking-wide uppercase bg-gradient-to-r from-redshift-600 via-redshift-500 to-amber-500 text-white shadow-xl shadow-redshift-600/30 hover:shadow-redshift-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Open Full Control Center</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
