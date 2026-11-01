import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SystemTelemetry, WorkerInfo, MetricsSnapshot } from '../api';

gsap.registerPlugin(ScrollTrigger);

interface StatsTickerProps {
  telemetry?: SystemTelemetry | null;
  workers?: WorkerInfo[];
  metrics?: MetricsSnapshot | null;
}

const TREE =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093215_95f11900-c4a0-49ad-bb2d-bb927dd594ee.png';

export const StatsTicker: React.FC<StatsTickerProps> = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const treeRef = useRef<HTMLImageElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const gridFieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) return;

    // Generate Petalyx grid-sq tiles
    if (gridFieldRef.current && gridFieldRef.current.children.length === 0) {
      for (let i = 0; i < 22; i++) {
        const sq = document.createElement('div');
        sq.className = 'grid-sq';
        const col = Math.floor(Math.random() * 28);
        const row = Math.floor(Math.random() * 5);
        sq.style.left = `${col * 48 - 10}px`;
        sq.style.top = `${row * 48 + 6}px`;
        sq.style.width = '46px';
        sq.style.height = '46px';
        sq.style.opacity = '0.35';
        gridFieldRef.current.appendChild(sq);

        gsap.to(sq, {
          opacity: Math.random() * 0.7 + 0.1,
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          delay: Math.random() * 3,
          repeatDelay: Math.random() * 2,
          ease: 'sine.inOut',
        });
      }
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.matchMedia({
        // Desktop Pinning
        '(min-width: 901px)': () => {
          if (!sectionRef.current) return;

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top top',
              end: '+=120%',
              pin: true,
              scrub: 1,
            },
          });

          // Rising tree animation
          if (treeRef.current) {
            tl.fromTo(
              treeRef.current,
              { yPercent: 75 },
              { yPercent: 6, ease: 'none' },
              0
            );
          }

          // Cards reveal
          if (cardsRef.current) {
            gsap.from(cardsRef.current.children, {
              y: 40,
              opacity: 0,
              stagger: 0.08,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 70%',
              },
            });
          }
        },

        // Mobile fallback (unpinned)
        '(max-width: 900px)': () => {
          if (treeRef.current) {
            gsap.fromTo(
              treeRef.current,
              { yPercent: 40 },
              {
                yPercent: 0,
                ease: 'none',
                scrollTrigger: {
                  trigger: sectionRef.current,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 1,
                },
              }
            );
          }
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const cardsData = [
    {
      label: 'CPU & Vector Compute',
      value: 'SIMD+',
      sublabel: 'AVX2, AVX-512, NEON & multi-core',
    },
    {
      label: 'Memory Architecture',
      value: 'Unified',
      sublabel: 'System RAM & GPU VRAM bandwidth',
    },
    {
      label: 'Execution Backends',
      value: 'Direct',
      sublabel: 'CUDA, Metal, Vulkan & CPU native',
    },
    {
      label: 'Safety Guardrails',
      value: '<80°C',
      sublabel: 'Thermal abort & 2GB memory reserve',
    },
  ];

  return (
    <section
      id="product"
      ref={sectionRef}
      className="stats relative h-auto min-h-screen py-20 md:py-0 md:h-screen md:min-h-[680px] overflow-hidden bg-white flex flex-col justify-center items-center select-none"
    >
      {/* Background Grid Field */}
      <div
        ref={gridFieldRef}
        className="sq-field absolute inset-x-0 top-0 h-[42%] z-0 pointer-events-none overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, #000 40%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 40%, transparent)',
        }}
        aria-hidden="true"
      />

      {/* Cherry Blossom Tree rising from behind */}
      <div
        className="tree-wrap absolute z-10 left-1/2 -translate-x-1/2 bottom-[-2%] w-[min(380px,58vw)] pointer-events-none"
        aria-hidden="true"
      >
        <img
          id="tree"
          ref={treeRef}
          src={TREE}
          alt=""
          className="w-full h-auto drop-shadow-md"
        />
      </div>

      {/* Main Stats Inner Content */}
      <div className="stats-inner relative z-20 w-full max-w-5xl mx-auto px-4 flex flex-col items-center gap-5 text-center">
        {/* Pill */}
        <span className="pill">
          MEASURE THE MACHINE YOU ACTUALLY HAVE
        </span>

        {/* Headline */}
        <h2 className="h2 text-[#121410] max-w-2xl">
          One toolkit. Your whole system.
        </h2>

        {/* Intro Copy */}
        <p className="text-xs sm:text-sm text-[#2d3623] max-w-2xl mx-auto leading-relaxed -mt-1 font-normal">
          A laptop without a dedicated GPU still has a story worth measuring. A workstation with multiple accelerators
          deserves more than a generic score. MARDUK detects the hardware and supported execution paths on your
          computer, then runs the tests that genuinely apply.
        </p>

        {/* 4 Ticket Cards */}
        <div
          ref={cardsRef}
          className="cards relative z-30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-[880px] mt-2"
        >
          {cardsData.map((card, idx) => (
            <div
              key={idx}
              className="card-ticket h-[145px] p-5 flex flex-col justify-between shadow-[0_4px_16px_rgba(77,106,16,0.12)] border border-[#a2bf3c]/40 hover:scale-[1.02] transition-transform duration-300"
            >
              <div className="text-[11px] font-semibold text-[#2a3410] uppercase tracking-wider">
                {card.label}
              </div>
              <div>
                <b className="text-3xl sm:text-4xl font-semibold tracking-[-0.04em] text-[#151a08] tabular-nums block">
                  {card.value}
                </b>
                <span className="text-[10px] text-[#334015] font-medium block truncate mt-1">
                  {card.sublabel}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Card Shadow */}
        <div
          className="cards-shadow w-[min(820px,94%)] h-[10px] -mt-3 rounded-[50%] z-10 pointer-events-none"
          style={{
            background: 'radial-gradient(closest-side, rgba(0,0,0,0.08), transparent)',
          }}
          aria-hidden="true"
        />

        {/* Frosted Band & Ecosystem Logos */}
        <div className="relative w-[min(860px,100%)] flex justify-center items-center mt-2">
          {/* Frosted strip where the tree passes behind */}
          <div
            id="band"
            className="absolute z-20 top-[-6px] w-[min(340px,58vw)] h-[64px] backdrop-blur-[14px] bg-white/20 pointer-events-none"
            style={{
              maskImage:
                'linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)',
              WebkitMaskImage:
                'linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)',
            }}
            aria-hidden="true"
          />

          {/* Infrastructure Framework Logos */}
          <div className="logos relative z-30 flex flex-wrap items-center justify-between gap-6 sm:gap-10 w-full px-4 py-2 text-[#242b1a] text-xs sm:text-sm font-semibold tracking-tight opacity-80">
            <span className="flex items-center gap-1.5 hover:opacity-100 transition-opacity">
              <span className="w-2 h-2 rounded-full bg-[#4d6a10]" />
              Windows x64
            </span>
            <span className="hover:opacity-100 transition-opacity">Apple Silicon (Metal)</span>
            <span className="hover:opacity-100 transition-opacity">Linux (x86_64)</span>
            <span className="hover:opacity-100 transition-opacity">NVIDIA CUDA</span>
            <span className="hover:opacity-100 transition-opacity">CPU SIMD Engines</span>
          </div>
        </div>
      </div>
    </section>
  );
};

