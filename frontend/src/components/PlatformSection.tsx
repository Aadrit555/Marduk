import React from 'react';
import { Monitor, Laptop, Terminal, Cpu, CheckCircle2 } from 'lucide-react';

export const PlatformSection: React.FC = () => {
  const platforms = [
    {
      id: 'windows',
      icon: Monitor,
      title: 'Windows PCs and workstations',
      status: 'Validated x64 Build',
      copy: 'CPU tests are available on supported Windows systems. NVIDIA CUDA tests are available when a compatible GPU, driver and runtime are detected. Other GPU paths are shown only when validated on the device.',
      features: [
        'Multi-core CPU GEMM & AVX2/FMA3 SIMD acceleration',
        'Direct NVML hardware telemetry (temp, power, clocks)',
        'Native Windows x64 desktop installer',
      ],
      tag: 'Windows 10 / 11 (x64)',
    },
    {
      id: 'macos',
      icon: Laptop,
      title: 'MacBook and Mac desktops',
      status: 'Apple Silicon Ready',
      copy: 'Apple Silicon systems are evaluated with CPU and supported Metal GPU workloads. MARDUK accounts for unified memory and does not report it as dedicated VRAM. Sensor availability varies by model and macOS version.',
      features: [
        'Apple Silicon ARM NEON and CPU vector throughput',
        'Unified memory architecture detection (RAM/VRAM parity)',
        'Metal compute backend integration',
      ],
      tag: 'macOS 13+ (Apple Silicon)',
    },
    {
      id: 'linux',
      icon: Terminal,
      title: 'Linux systems',
      status: 'Server & Workstation',
      copy: 'CPU tests work independently of GPU availability. GPU tests depend on the detected device, driver and supported compute backend, including compatible NVIDIA or AMD configurations.',
      features: [
        'Headless CLI execution for automated test farms',
        'Direct Linux sysfs & NVML hardware telemetry',
        'Reproducible JSON / CSV benchmarking export',
      ],
      tag: 'glibc 2.31+ (x86_64)',
    },
    {
      id: 'cpu-only',
      icon: Cpu,
      title: 'No dedicated GPU? Still fully useful.',
      status: 'First-Class Support',
      copy: 'Run CPU compute, memory and supported vector benchmarks. If no compatible GPU backend is present, MARDUK explains what is unavailable and continues with the tests your machine can run.',
      features: [
        'Single-core IPC & Rayon multi-threaded scaling',
        'STREAM-style system RAM throughput bandwidth',
        'Zero artificial zeros or broken UI states',
      ],
      tag: 'All Systems',
    },
  ];

  return (
    <section id="compatibility" className="py-24 px-4 sm:px-6 bg-[#fafbf8] select-none border-t border-[#eef0ea]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="pill mb-3">
            BUILT AROUND YOUR HARDWARE
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#121410] leading-tight mb-4">
            Different machines. Honest measurements.
          </h2>
          <p className="text-sm sm:text-base text-[#4a543f] leading-relaxed font-normal max-w-2xl mx-auto">
            MARDUK adapts its tests to the hardware and drivers it can verify. The available benchmarks
            vary by device, operating system and installed backend.
          </p>
        </div>

        {/* 4 Platform Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <div
                key={platform.id}
                className="bg-white rounded-3xl p-7 sm:p-8 border border-[#eef0ea] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-[#b4cd52]/70 hover:shadow-[0_8px_30px_rgba(77,106,16,0.08)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#e7efcf] flex items-center justify-center text-[#4d6a10]">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#f3f5ee] text-[#4d6a10] border border-[#e3e8db]">
                      {platform.tag}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-semibold text-[#121410] tracking-tight mb-2.5">
                    {platform.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#46503b] leading-relaxed mb-6 font-normal">
                    {platform.copy}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#f0f2eb]">
                  <ul className="space-y-2">
                    {platform.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs sm:text-xs text-[#2a3410]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6f9a0c] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note on release validation */}
        <p className="text-center text-[11px] sm:text-xs text-[#6e7d60] mt-10">
          Hardware test availability is strictly determined by physical device and runtime capabilities.
          MARDUK never claims an unsupported platform is fully functional.
        </p>
      </div>
    </section>
  );
};

