import React from 'react';
import { Search, Sliders, PlayCircle, BarChart3, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Detect',
      icon: Search,
      copy: 'MARDUK identifies your CPU, graphics devices, memory and supported backends.',
      details: 'Evaluates instruction sets (AVX2, AVX-512, NEON), NVML telemetry bindings, and VRAM capacity.',
    },
    {
      step: '02',
      title: 'Choose',
      icon: Sliders,
      copy: 'Select a quick, standard or extended test profile. Review the resource budget before starting.',
      details: 'Explicit duration bounds and guaranteed 20% / 2 GiB memory headroom protection.',
    },
    {
      step: '03',
      title: 'Measure',
      icon: PlayCircle,
      copy: 'The desktop app runs bounded workloads locally and records real execution time and available telemetry.',
      details: 'Continuous sampling of instantaneous power, clocks, thermals, and FLOPs throughput.',
    },
    {
      step: '04',
      title: 'Understand',
      icon: BarChart3,
      copy: 'Review raw metrics, methodology, hardware context and repeat-run history.',
      details: 'Stored offline in embedded SQLite WAL. Export reproducible results to JSON or CSV.',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-white select-none border-t border-[#eef0ea]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="pill mb-3">
            VERIFIABLE METHODOLOGY
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#121410] leading-tight mb-4">
            From detection to a result you can trust.
          </h2>
          <p className="text-sm sm:text-base text-[#4a543f] leading-relaxed font-normal max-w-xl mx-auto">
            Every step is bounded, observable, and designed to yield meaningful measurements without risk.
          </p>
        </div>

        {/* 4 Step Timeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={st.step}
                className="relative bg-[#fafbf8] rounded-3xl p-6 border border-[#eef0ea] flex flex-col justify-between hover:border-[#b4cd52] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-[#4d6a10] bg-[#e7efcf] px-2.5 py-1 rounded-full">
                      STEP {st.step}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#4d6a10] border border-[#eef0ea]">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-[#121410] tracking-tight mb-2">
                    {st.title}
                  </h3>

                  <p className="text-xs text-[#2c3326] leading-relaxed mb-4 font-normal">
                    {st.copy}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#eef0ea] text-[11px] text-[#6b775e] leading-snug">
                  {st.details}
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-[#b4cd52]">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

