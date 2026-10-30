import React from 'react';
import { ArrowRight, Cpu, Zap, Activity } from 'lucide-react';

interface HeroProps {
  onOpenDashboard: () => void;
  metrics: {
    total_tokens: number;
    active_gpus: number;
    completed_requests: number;
    latency_ms: number;
  };
}

export const Hero: React.FC<HeroProps> = ({ onOpenDashboard, metrics }) => {
  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden">
      {/* Background Redshift Celestial Image with Vertical Plasma Beam */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img
          src="/peakline_redshift_bg.jpg"
          alt="Peakline Redshift Atmosphere"
          className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.08]"
        />
        {/* Atmospheric Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/40 to-black/30" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-[#050507]/80" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] redshift-glow pointer-events-none opacity-40 blur-3xl" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center space-y-6">
        {/* Floating Social Proof / Technology Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill border border-white/10 text-xs font-mono text-zinc-300 shadow-2xl backdrop-blur-md">
          <span className="flex items-center justify-center w-4 h-4 rounded bg-redshift-500 text-white font-bold text-[9px]">
            Y
          </span>
          <span className="text-zinc-400">Backed by:</span>
          <span className="text-white font-semibold tracking-wide">Y Combinator</span>
          <span className="text-zinc-500 mx-1">•</span>
          <span className="text-redshift-300 flex items-center gap-1 font-medium">
            <Zap className="w-3 h-3 text-redshift-400 inline" />
            MARDUK Core
          </span>
        </div>

        {/* Display Serif Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-normal tracking-tight text-white leading-[1.08] max-w-3xl drop-shadow-md">
          Propel your mission-critical <br />
          <span className="italic font-serif text-redshift-200">AI compute</span> to the absolute peak
        </h1>

        {/* Supporting Description */}
        <p className="text-sm sm:text-base md:text-lg text-zinc-300 max-w-xl font-normal leading-relaxed drop-shadow">
          Advanced reasoning systems, distributed GPU orchestration, and predictive model scheduling built for the unknown.
        </p>

        {/* Interactive Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onOpenDashboard}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide text-black bg-white hover:bg-zinc-200 shadow-xl shadow-redshift-600/20 hover:shadow-redshift-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Launch Control Center</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>

          <a
            href="#cluster"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full font-medium text-sm text-zinc-200 glass-pill hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
          >
            <Activity className="w-4 h-4 text-redshift-400" />
            <span>Inspect Live Cluster</span>
          </a>
        </div>

        {/* Real-time Hardware Telemetry Bar */}
        <div className="pt-10 w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl glass-panel text-left">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Throughput</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {metrics.total_tokens.toLocaleString()} <span className="text-[10px] text-zinc-400">tok/s</span>
            </div>
          </div>

          <div className="p-3 rounded-xl glass-panel text-left">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Active GPUs</div>
            <div className="text-lg font-bold text-redshift-400 font-mono mt-0.5 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              <span>{metrics.active_gpus} Node</span>
            </div>
          </div>

          <div className="p-3 rounded-xl glass-panel text-left">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Dispatched</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {metrics.completed_requests} <span className="text-[10px] text-zinc-400">reqs</span>
            </div>
          </div>

          <div className="p-3 rounded-xl glass-panel text-left">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">P50 Latency</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              {metrics.latency_ms.toFixed(1)} <span className="text-[10px] text-zinc-400">ms</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
