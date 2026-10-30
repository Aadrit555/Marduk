import React from 'react';
import { GlyphPortal } from './ui/glyph-portal';
import { Zap, ArrowRight, Cpu, Layers } from 'lucide-react';

interface PortalLandingProps {
  onEnterControlCenter: () => void;
}

export const PortalLanding: React.FC<PortalLandingProps> = ({ onEnterControlCenter }) => {
  return (
    <div className="min-h-screen bg-[#060911] text-white selection:bg-violet-500/30 selection:text-violet-200">
      <GlyphPortal
        word="MARDUK"
        fontWeight={700}
        fontFamily='"Inter", "Segoe UI", -apple-system, sans-serif'
        scrollLength={2.4}
        interactive={true}
        annotations={false}
        enterLabel="ENTER MARDUK"
        front={
          <div className="w-full h-full relative pointer-events-none">
            {/* Top Bar */}
            <div className="absolute top-6 sm:top-10 inset-x-6 sm:inset-x-12 flex items-center justify-between text-xs tracking-wider font-mono">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/20">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-white">MARDUK</span>
              </div>
              <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800">
                AI Inference Infrastructure
              </div>
            </div>

            {/* Supporting Headline and Subtext */}
            <div className="absolute inset-x-6 sm:inset-x-12 text-center pointer-events-none" style={{ top: 'calc(var(--gp-word-bottom, 50%) + 24px)' }}>
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white mb-2">
                Intelligent orchestration for modern AI compute.
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto font-normal leading-relaxed">
                One control plane for GPU resources, inference workers, model execution and intelligent scheduling.
              </p>
            </div>
          </div>
        }
      >
        {/* Revealed Content After Scrolling Into The Portal */}
        <div className="max-w-5xl mx-auto py-12 px-6 sm:px-8 space-y-12">
          {/* Main Transition Heading */}
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-mono uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              Runtime Control Plane
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-tight">
              Your compute.<br />Under control.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Manage inference workloads, monitor GPU resources and coordinate distributed model execution through one intelligent runtime.
            </p>
          </div>

          {/* Three Concise Feature Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* Feature 01 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-violet-500/40 transition-all space-y-3">
              <div className="text-xs font-mono font-bold text-violet-400 tracking-wider">
                01 — GPU ORCHESTRATION
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Hardware Telemetry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Monitor available devices, VRAM, GPU workloads and worker assignments with zero synthetic figures.
              </p>
            </div>

            {/* Feature 02 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 transition-all space-y-3">
              <div className="text-xs font-mono font-bold text-amber-400 tracking-wider">
                02 — INTELLIGENT SCHEDULING
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Explainable Routing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Route inference requests according to real resource availability, queue depth and workload characteristics.
              </p>
            </div>

            {/* Feature 03 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all space-y-3">
              <div className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
                03 — INFERENCE CONTROL
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Fleet Management</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Manage models, workers, requests and performance through a unified OpenAI-compatible interface.
              </p>
            </div>
          </div>

          {/* Prominent Action Button: Open Control Center */}
          <div className="pt-6 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={onEnterControlCenter}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-sm tracking-wide uppercase bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none"
            >
              <span>Open Control Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 font-mono">
              Live Connection • 127.0.0.1:8080 • NVML Enabled
            </span>
          </div>
        </div>
      </GlyphPortal>
    </div>
  );
};
