import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Does MARDUK run benchmarks in the browser?',
      a: 'No. The website explains the product and distributes the installers. Hardware discovery and benchmark execution happen locally in MARDUK Desktop.',
    },
    {
      q: 'Can I use MARDUK without a dedicated GPU?',
      a: 'Yes. CPU compute and system-memory tests are first-class features. GPU-only tests are shown as unavailable when no compatible device and backend are detected.',
    },
    {
      q: 'Does MARDUK support Apple Silicon?',
      a: 'The application is designed to support Apple Silicon CPU and compatible Metal GPU workloads. Exact test availability depends on the MARDUK release and macOS/device support. Apple unified memory is identified separately from dedicated GPU memory.',
    },
    {
      q: 'Does MARDUK overclock my hardware?',
      a: 'No. MARDUK does not change voltage, clock settings, fan speeds or hardware power limits.',
    },
    {
      q: 'Does it upload my benchmark results?',
      a: 'Benchmark results are stored locally by default. Any optional diagnostic-sharing functionality must ask for explicit consent.',
    },
    {
      q: 'Why can two GPUs receive different scores in the same test?',
      a: 'Results depend on the hardware, driver, backend, precision, workload size, power state and benchmark version. MARDUK records this context so comparisons are meaningful.',
    },
    {
      q: 'Does a high score guarantee gaming or AI performance in every application?',
      a: 'No. A benchmark measures a defined workload. Real applications may behave differently depending on software, memory, drivers and workload characteristics.',
    },
    {
      q: 'Can I stop a benchmark?',
      a: 'Yes. Running tests expose a cancellation control. MARDUK stops scheduling new work and releases benchmark resources safely after outstanding operations have completed.',
    },
  ];

  const toggleFaq = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 bg-white select-none border-t border-[#eef0ea]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="pill mb-3">
            QUESTIONS & ANSWERS
          </span>
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#121410] leading-tight mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#4d5642] font-normal leading-relaxed">
            Direct, technical answers about MARDUK desktop benchmarking, privacy, and safety.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="border border-[#eef0ea] rounded-2xl overflow-hidden transition-colors bg-[#fafbf8]"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-semibold text-[#121410]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#4d6a10] shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-[#38432b] leading-relaxed border-t border-[#f0f2ea] bg-white">
                    {faq.a}
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

