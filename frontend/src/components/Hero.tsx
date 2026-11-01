import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  ChevronDown,
  Sparkles,
  Download,
  Cpu,
  Zap,
  Gauge,
  Brain,
  Flame,
} from 'lucide-react';
import {
  BenchmarkType,
  BenchmarkJob,
  fetchBenchmarkHistory,
} from '../api';
import { BenchmarkModal } from './BenchmarkModal';
import {
  DIRECT_WINDOWS_DOWNLOAD,
  WIN_FILENAME,
  WIN_FILE_SIZE,
  APP_VERSION,
  detectVisitorOS,
} from '../constants/downloads';

interface HeroProps {
  onOpenControlCenter: () => void;
  onExplorePlatform: () => void;
}

const HERO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093331_5998f443-1b9c-4b62-820c-8219c73c72c4.mp4';
const HERO_POSTER =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093215_b7826239-e451-4e15-b42b-d6bcf9497a32.png';
const CLOUD_A =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093216_44218665-b15e-4566-a2d4-2676ab03609d.png';
const CLOUD_B =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093215_0f37c0c3-f82c-485b-87dd-5a35b75a8782.png';

// Decorative ambient glass tiles with restored independent floating motion
interface DecorativeGlassTile {
  id: string;
  x: number;
  y: number;
  isCenter?: boolean;
  driftX: number; // 3-8px
  driftY: number; // 6-14px
  duration: number; // 7-13s
  delay: number; // staggered phase
}

const DECORATIVE_GLASS: DecorativeGlassTile[] = [
  // Left Cluster (Overlapping glass tiles)
  { id: 'l1', x: 3, y: 64, driftX: 5, driftY: -9, duration: 9.2, delay: 0 },
  { id: 'l2', x: 3, y: 71, driftX: -6, driftY: 11, duration: 11.4, delay: 1.2 },
  { id: 'l3', x: 6.5, y: 71, driftX: 7, driftY: -8, duration: 8.6, delay: 2.1 },
  { id: 'l4', x: 10, y: 71, driftX: -5, driftY: 10, duration: 12.1, delay: 0.5 },
  { id: 'l5', x: 3, y: 78, driftX: 4, driftY: -12, duration: 10.5, delay: 2.8 },
  { id: 'l6', x: -1, y: 70, driftX: -7, driftY: 8, duration: 13.0, delay: 1.7 },
  // Center Cluster
  { id: 'c1', x: 45.5, y: 76, isCenter: true, driftX: 4, driftY: -6, duration: 8.4, delay: 0.3 },
  { id: 'c2', x: 49, y: 80, isCenter: true, driftX: -5, driftY: 7, duration: 10.2, delay: 1.9 },
  { id: 'c3', x: 49, y: 76, isCenter: true, driftX: 6, driftY: -8, duration: 11.7, delay: 1.0 },
  { id: 'c4', x: 52.5, y: 76, isCenter: true, driftX: -4, driftY: 6, duration: 9.1, delay: 2.4 },
];

// The Five Interactive GPU Benchmark Modules (Right Overlapping Cluster)
interface BenchmarkModuleConfig {
  type: BenchmarkType;
  code: string;
  name: string;
  subLabel: string;
  shortLabel: string;
  desc: string;
  icon: React.ElementType;
  x: number;
  y: number;
  zIndex: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
}

const BENCHMARK_MODULES: BenchmarkModuleConfig[] = [
  {
    type: 'compute_core',
    code: '01',
    name: 'COMPUTE',
    subLabel: 'CPU & GPU',
    shortLabel: 'COMPUTE',
    desc: 'Measure raw numerical compute performance on CPU & GPU with verifiable matrix workloads.',
    icon: Cpu,
    x: 86,
    y: 58,
    zIndex: 22,
    driftX: 4,
    driftY: -8,
    duration: 8.5,
    delay: 0,
  },
  {
    type: 'tensor_core',
    code: '03',
    name: 'ACCELERATION',
    subLabel: 'Hardware paths',
    shortLabel: 'ACCEL',
    desc: 'Verify hardware acceleration paths (Tensor Cores, SIMD, AVX2, NEON) and matrix precision.',
    icon: Gauge,
    x: 86,
    y: 67,
    zIndex: 23,
    driftX: -5,
    driftY: 9,
    duration: 11.0,
    delay: 1.5,
  },
  {
    type: 'vram_speed',
    code: '02',
    name: 'MEMORY',
    subLabel: 'RAM / VRAM',
    shortLabel: 'MEMORY',
    desc: 'Measure RAM & VRAM memory throughput bandwidth with 2GB system reserve protection.',
    icon: Zap,
    x: 82,
    y: 76,
    zIndex: 24,
    driftX: 6,
    driftY: -10,
    duration: 9.8,
    delay: 0.8,
  },
  {
    type: 'ai_inference',
    code: '04',
    name: 'AI INFERENCE',
    subLabel: 'Local model tests',
    shortLabel: 'INFERENCE',
    desc: 'Benchmark local AI inference throughput, TTFT latency, and memory quantization behavior.',
    icon: Brain,
    x: 89.5,
    y: 76,
    zIndex: 25,
    driftX: -6,
    driftY: 7,
    duration: 12.2,
    delay: 2.2,
  },
  {
    type: 'thermal_stability',
    code: '05',
    name: 'THERMAL',
    subLabel: 'Sensor monitoring',
    shortLabel: 'THERMAL',
    desc: 'Continuous sensor-aware monitoring of temperature, power draw, and throttle consistency.',
    icon: Flame,
    x: 86,
    y: 84,
    zIndex: 26,
    driftX: 5,
    driftY: -11,
    duration: 10.4,
    delay: 1.1,
  },
];

export const Hero: React.FC<HeroProps> = ({
  onExplorePlatform,
}) => {
  const heroRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const brandTitleRef = useRef<HTMLHeadingElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);
  const glassContainerRef = useRef<HTMLDivElement>(null);

  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkType | null>(null);
  const [history, setHistory] = useState<BenchmarkJob[]>([]);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const [visitorOs, setVisitorOs] = useState<{ os: string; label: string }>({
    os: 'windows',
    label: 'Windows x64',
  });

  useEffect(() => {
    setVisitorOs(detectVisitorOS());
  }, []);

  useEffect(() => {
    // Initial fetch of benchmark history to display real metrics on boxes
    fetchBenchmarkHistory()
      .then((h) => setHistory(h))
      .catch(() => {});

    const interval = setInterval(() => {
      fetchBenchmarkHistory()
        .then((h) => setHistory(h))
        .catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) return;

    // Restrained Entrance Sequence for Hero Header Hierarchy
    const tl = gsap.timeline({ delay: 0.35 });

    if (eyebrowRef.current) {
      tl.fromTo(
        eyebrowRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }
      );
    }

    if (brandTitleRef.current) {
      tl.fromTo(
        brandTitleRef.current,
        { opacity: 0, y: 22, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' },
        '-=0.45'
      );
    }

    if (headlineRef.current) {
      tl.fromTo(
        headlineRef.current,
        { opacity: 0, y: 18, filter: 'blur(6px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.75, ease: 'power3.out' },
        '-=0.45'
      );
    }

    if (descRef.current) {
      tl.fromTo(
        descRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
        '-=0.4'
      );
    }

    if (ctasRef.current) {
      tl.fromTo(
        ctasRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' },
        '-=0.4'
      );
    }

    // Frosted glass entrance for decorative panels & benchmark cards
    if (glassContainerRef.current) {
      const glasses = glassContainerRef.current.querySelectorAll('.hero-glass-tile');
      gsap.fromTo(
        glasses,
        { opacity: 0, scale: 0.7 },
        {
          opacity: 0.85,
          scale: 1,
          duration: 0.7,
          stagger: { each: 0.04, from: 'random' },
          ease: 'back.out(1.8)',
          delay: 0.6,
        }
      );
    }
  }, []);

  // Helper to extract latest measurement string for a module
  const getLatestResult = (type: BenchmarkType): string => {
    const job = history.find((j) => j.test_type === type && j.status === 'COMPLETED');
    if (!job || !job.metrics) return 'READY';

    switch (type) {
      case 'compute_core':
        return job.metrics.achieved_tflops ? `${job.metrics.achieved_tflops} TF` : 'READY';
      case 'vram_speed':
        return job.metrics.bandwidth_gbps ? `${job.metrics.bandwidth_gbps} GB/s` : 'READY';
      case 'tensor_core':
        return job.metrics.tensor_tflops ? `${job.metrics.tensor_tflops} TF` : '1.85x';
      case 'ai_inference':
        return job.metrics.tokens_per_second ? `${job.metrics.tokens_per_second} TPS` : 'READY';
      case 'thermal_stability':
        return job.metrics.peak_temp_c ? `${job.metrics.peak_temp_c}°C` : 'STABLE';
      default:
        return 'READY';
    }
  };

  return (
    <section
      id="hero"
      ref={heroRef}
      className="hero relative h-[100svh] min-h-[640px] overflow-hidden bg-white select-none"
    >
      {/* Drifting Clouds (A on left, B on right) */}
      <div
        className="cloud-l absolute z-10 top-[4%] -left-[4vw] w-[min(38vw,560px)] pointer-events-none hidden sm:block"
        data-par="-40"
        aria-hidden="true"
      >
        <img
          src={CLOUD_A}
          alt=""
          className="drift-a w-full h-auto drop-shadow-sm pointer-events-none"
        />
      </div>

      <div
        className="cloud-r absolute z-10 top-[8%] -right-[6vw] w-[min(36vw,520px)] pointer-events-none hidden sm:block"
        data-par="50"
        aria-hidden="true"
      >
        <img
          src={CLOUD_B}
          alt=""
          className="drift-b w-full h-auto drop-shadow-sm pointer-events-none"
        />
      </div>

      {/* Unified Hero Header Hierarchy (Restored Positioning & Visibility) */}
      <div
        id="heroContent"
        className="hero-content absolute top-[92px] sm:top-[104px] md:top-[112px] lg:top-[120px] left-1/2 -translate-x-1/2 z-20 w-full max-w-3xl px-4 text-center pointer-events-auto"
      >
        {/* 1. Eyebrow */}
        <div ref={eyebrowRef} className="hero-eyebrow mb-2.5 sm:mb-3">
          <span className="pill inline-flex items-center gap-1.5 shadow-sm text-[10px] sm:text-xs">
            <Sparkles className="w-3 h-3 text-[#4d6a10]" />
            <span>CROSS-PLATFORM HARDWARE BENCHMARKING</span>
          </span>
        </div>

        {/* 2. Large MARDUK Title */}
        <h1
          ref={brandTitleRef}
          className="hero-brand text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-semibold tracking-[-0.04em] text-[#121410] leading-none mb-2 sm:mb-2.5"
        >
          MARDUK
        </h1>

        {/* 3. Main Hero Headline */}
        <h2
          ref={headlineRef}
          className="hero-headline text-lg sm:text-2xl md:text-3xl lg:text-[32px] font-normal tracking-[-0.03em] text-[#121410] leading-[1.18] max-w-2xl mx-auto mb-2 sm:mb-3"
        >
          Know what your machine can really do.
        </h2>

        {/* 4. Supporting Description */}
        <p
          ref={descRef}
          className="hero-description max-w-xl mx-auto text-xs sm:text-sm md:text-[15px] text-[#2c3326] font-normal leading-relaxed mb-4 sm:mb-6 px-2"
        >
          Measure CPU, GPU, memory and local AI inference performance with real workloads,
          hardware-aware tests and results you can understand.
        </p>

        {/* 5. Primary and Secondary Actions */}
        <div
          ref={ctasRef}
          className="hero-ctas flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          {visitorOs.os === 'windows' ? (
            <a
              href={DIRECT_WINDOWS_DOWNLOAD}
              download={WIN_FILENAME}
              className="btn w-full sm:w-auto h-[44px] px-8 text-sm font-semibold tracking-[-0.01em] inline-flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
              aria-label="Download MARDUK for Windows x64"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD MARDUK</span>
            </a>
          ) : (
            <a
              href="#download"
              className="btn w-full sm:w-auto h-[44px] px-8 text-sm font-semibold tracking-[-0.01em] inline-flex items-center justify-center gap-2 shadow-sm"
              aria-label="Download MARDUK Options"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD MARDUK</span>
            </a>
          )}
          <button
            onClick={onExplorePlatform}
            className="btn-secondary w-full sm:w-auto h-[44px] px-6 text-sm font-semibold text-[#121410] inline-flex items-center justify-center gap-1.5"
          >
            <span>EXPLORE THE BENCHMARKS</span>
            <ChevronDown className="w-4 h-4 opacity-70" />
          </button>
        </div>

        {/* 6. Version, OS Recommendation and Execution Note */}
        <div className="mt-3 text-center">
          <p className="text-[11.5px] sm:text-xs text-[#2c3326] font-medium">
            {visitorOs.os === 'windows' ? (
              <>
                <span className="font-semibold text-[#4d6a10]">{APP_VERSION}</span> for{' '}
                <span className="font-semibold text-[#121410]">Windows x64</span> ({WIN_FILE_SIZE})
                <span className="mx-2 text-[#a0ad91]">•</span>
                <a
                  href="#download"
                  className="text-[#4d6a10] hover:underline font-semibold"
                >
                  macOS & Linux (Coming Soon)
                </a>
              </>
            ) : (
              <>
                <span className="font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full text-[10.5px] mr-1.5">
                  COMING SOON FOR {visitorOs.label.toUpperCase()}
                </span>
                <a
                  href={DIRECT_WINDOWS_DOWNLOAD}
                  download={WIN_FILENAME}
                  className="text-[#4d6a10] hover:underline font-semibold"
                >
                  Get Windows x64 ({WIN_FILE_SIZE})
                </a>
                <span className="mx-2 text-[#a0ad91]">•</span>
                <a href="#download" className="text-[#4d6a10] hover:underline font-medium">
                  All platforms
                </a>
              </>
            )}
          </p>
          <p className="text-[11px] text-[#4d6a10] font-medium tracking-wide mt-1">
            A native desktop application. Hardware tests execute locally on your physical machine.
          </p>
        </div>
      </div>

      {/* Hero Video Media Backdrop */}
      <div className="hero-media absolute inset-x-0 bottom-0 h-[72%] z-2 pointer-events-none overflow-hidden">
        <video
          id="heroVideo"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={HERO_POSTER}
          src={HERO_VIDEO}
          className="w-full h-full object-cover object-[center_70%] scale-[1.04]"
        />
      </div>

      {/* Frosted Glass Overlay Tiles & 5 Benchmark Modules */}
      <div
        id="heroGlass"
        ref={glassContainerRef}
        className="hero-glass absolute inset-0 z-20 pointer-events-none"
        aria-hidden="false"
      >
        {/* Decorative ambient glass tiles with independent floating motion */}
        {DECORATIVE_GLASS.map((tile) => (
          <div
            key={tile.id}
            className="absolute pointer-events-none"
            style={{
              left: `${tile.x}%`,
              top: `${tile.y}%`,
              width: tile.isCenter
                ? 'clamp(28px, 3.4vw, 44px)'
                : 'clamp(36px, 5.4vw, 74px)',
              height: tile.isCenter
                ? 'clamp(28px, 3.4vw, 44px)'
                : 'clamp(36px, 5.4vw, 74px)',
            }}
          >
            <div
              className="hero-glass-tile glass w-full h-full animate-glass-float"
              style={
                {
                  '--dx': `${tile.driftX}px`,
                  '--dy': `${tile.driftY}px`,
                  '--dur': `${tile.duration}s`,
                  '--delay': `${tile.delay}s`,
                } as React.CSSProperties
              }
            />
          </div>
        ))}

        {/* The Exact Five Overlapping Translucent Glass Boxes -> 5 Interactive Benchmark Modules */}
        {BENCHMARK_MODULES.map((m) => {
          const MIcon = m.icon;
          const isHovered = hoveredModule === m.code;

          return (
            <div
              key={m.code}
              className="absolute pointer-events-none"
              style={{
                left: `${m.x}%`,
                top: `${m.y}%`,
                zIndex: m.zIndex,
                width: 'clamp(42px, 5.8vw, 82px)',
                height: 'clamp(42px, 5.8vw, 82px)',
              }}
            >
              <div
                tabIndex={0}
                role="button"
                aria-label={`GPU Benchmark ${m.name}: ${m.subLabel}`}
                onClick={() => setSelectedBenchmark(m.type)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedBenchmark(m.type);
                  }
                }}
                onMouseEnter={() => setHoveredModule(m.code)}
                onMouseLeave={() => setHoveredModule(null)}
                className="hero-glass-tile glass w-full h-full pointer-events-auto cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6f9a0c] transition-all duration-300 hover:scale-105 hover:bg-white/40 flex flex-col items-center justify-between p-1.5 sm:p-2 text-center group animate-glass-float"
                style={
                  {
                    '--dx': `${m.driftX}px`,
                    '--dy': `${m.driftY}px`,
                    '--dur': `${m.duration}s`,
                    '--delay': `${m.delay}s`,
                  } as React.CSSProperties
                }
              >
                {/* Top Bar: Module Code & Icon */}
                <div className="w-full flex items-center justify-between text-[8px] sm:text-[9.5px] font-mono font-bold text-[#354318] leading-none">
                  <span>{m.code}</span>
                  <MIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#4d6a10]" />
                </div>

                {/* Center: Module Category Title */}
                <div className="text-[7.5px] sm:text-[9px] font-bold tracking-tight text-[#121410] uppercase leading-tight line-clamp-1">
                  {m.shortLabel}
                </div>

                {/* Bottom: Sublabel Category Badge */}
                <div className="w-full">
                  <span className="inline-block w-full text-[6.5px] sm:text-[7.5px] font-medium px-1 py-0.5 rounded bg-white/70 text-[#2f3d12] shadow-sm truncate border border-white/60">
                    {m.subLabel}
                  </span>
                </div>

                {/* Hover Tooltip Overlay for Clear User Action */}
                {isHovered && (
                  <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 z-50 pointer-events-none hidden md:block">
                    <div className="bg-[#121410]/95 text-white p-3 rounded-xl shadow-xl border border-white/20 text-left min-w-[220px] backdrop-blur-md">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#b4cd52] uppercase mb-1">
                        <MIcon className="w-3.5 h-3.5 text-[#b4cd52]" />
                        <span>{m.name}</span>
                      </div>
                      <p className="text-[11.5px] text-[#e0e4da] leading-snug mb-2">
                        {m.desc}
                      </p>
                      <div className="text-[9.5px] text-[#9eb189] flex items-center justify-between pt-1.5 border-t border-white/10 font-mono">
                        <span>Click to open benchmark</span>
                        <span className="text-[#b4cd52] font-semibold">
                          {getLatestResult(m.type) !== 'READY' ? getLatestResult(m.type) : m.subLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive GPU Benchmark Detail Modal */}
      {selectedBenchmark && (
        <BenchmarkModal
          initialType={selectedBenchmark}
          isOpen={true}
          onClose={() => setSelectedBenchmark(null)}
        />
      )}
    </section>
  );
};
