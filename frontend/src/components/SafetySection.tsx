import React from 'react';
import { ShieldCheck, Lock, Activity, Check, AlertTriangle } from 'lucide-react';

export const SafetySection: React.FC = () => {
  const safetyBullets = [
    'Short default tests with explicit duration limits.',
    'Memory budgets that preserve system and GPU headroom (20% or 2 GiB reserve).',
    'Sequential intensive tests by default; no concurrent stress collisions.',
    'Battery and resource-pressure warnings where detectable.',
    'Clear reporting when sensor data is unavailable.',
    'Local results by default; no automatic upload of hardware telemetry.',
  ];

  return (
    <section id="safety" className="py-24 px-4 sm:px-6 bg-[#fafbf8] select-none border-t border-[#eef0ea]">
      <div className="max-w-6xl mx-auto">
        {/* Safety & Boundaries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <span className="pill mb-3">
              SAFETY CONTROLS & GUARDRAILS
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#121410] leading-tight mb-5">
              Benchmark with boundaries.
            </h2>
            <p className="text-sm sm:text-base text-[#38432d] leading-relaxed mb-6 font-normal">
              MARDUK uses bounded workloads, conservative memory budgets, cancellation and sensor-aware
              guardrails. It does not overclock, change voltage, adjust fan speeds or alter hardware power limits.
              Sensor access and safety enforcement vary by platform; no software can guarantee zero risk on every machine.
            </p>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/60 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">
                <strong className="font-semibold">Automatic 80°C Thermal Protection:</strong> Workloads continuously sample
                core junction thermals via NVML. If GPU temperature reaches or exceeds 80°C, the test aborts immediately.
              </p>
            </div>

            <ul className="space-y-2.5">
              {safetyBullets.map((bullet, idx) => (
                <li key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-[#2a3410]">
                  <span className="w-5 h-5 rounded-full bg-[#e7efcf] flex items-center justify-center shrink-0 text-[#4d6a10]">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Privacy & Rating Methodology Cards */}
          <div className="flex flex-col gap-6">
            {/* Privacy Card */}
            <div className="bg-white rounded-3xl p-8 border border-[#eef0ea] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#e7efcf] flex items-center justify-center text-[#4d6a10]">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#121410] tracking-tight">
                  Your hardware data stays yours.
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#3e4832] leading-relaxed font-normal">
                Benchmark runs and hardware details are stored locally by default in an embedded SQLite database.
                MARDUK does not require an account to run local tests. Any future diagnostic-sharing feature
                must be optional, clearly explained and disabled by default.
              </p>
            </div>

            {/* Rating Methodology Card */}
            <div className="bg-white rounded-3xl p-8 border border-[#eef0ea] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#e7efcf] flex items-center justify-center text-[#4d6a10]">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#121410] tracking-tight">
                  Scores with context. Not mystery numbers.
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#3e4832] leading-relaxed font-normal mb-3">
                MARDUK presents CPU, GPU and AI inference results separately. Scores are tied to a benchmark
                version, workload, precision and execution backend. When a trustworthy comparison baseline
                is not available, MARDUK shows the measured result instead of inventing a universal score.
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4d6a10]">
                <ShieldCheck className="w-4 h-4" />
                <span>Deterministic Scoring Engine v1.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

