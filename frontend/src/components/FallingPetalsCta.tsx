import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Download, Monitor, Laptop, Terminal, Copy, Check, ExternalLink } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface FallingPetalsCtaProps {
  onOpenControlCenter?: () => void;
}

const NIGHT_IMAGE =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093217_cc690198-ad8c-4127-8734-8485bd878351.png';

export const FallingPetalsCta: React.FC<FallingPetalsCtaProps> = () => {
  const ctaRef = useRef<HTMLElement>(null);
  const ctaImgRef = useRef<HTMLImageElement>(null);
  const ctaCardRef = useRef<HTMLDivElement>(null);
  const petalsRef = useRef<HTMLDivElement>(null);

  const [selectedPlatform, setSelectedPlatform] = useState<'windows' | 'macos' | 'linux'>('windows');
  const [copiedSha, setCopiedSha] = useState<boolean>(false);

  const winSha = 'e3dbef7e11624e86329940f33b84c9838d512e5cfac04ae6c771ecaf8e36900c';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Generate Petalyx 18 falling petals
    if (petalsRef.current && petalsRef.current.children.length === 0) {
      for (let i = 0; i < 18; i++) {
        const petal = document.createElement('span');
        petal.className = 'petal';
        const left = Math.random() * 100;
        const dx = (Math.random() * 160 - 80).toFixed(0) + 'px';
        const dur = (Math.random() * 9 + 9).toFixed(1) + 's';
        const delay = (-Math.random() * 15).toFixed(1) + 's';
        const scale = (Math.random() * 0.8 + 0.6).toFixed(2);

        petal.style.left = `${left}%`;
        petal.style.setProperty('--dx', dx);
        petal.style.animationDuration = dur;
        petal.style.animationDelay = delay;
        petal.style.transform = `scale(${scale})`;
        petalsRef.current.appendChild(petal);
      }
    }

    if (isReduced) return;

    const ctx = gsap.context(() => {
      // Background Image Parallax Scrub
      if (ctaImgRef.current && ctaRef.current) {
        gsap.fromTo(
          ctaImgRef.current,
          { yPercent: -12 },
          {
            yPercent: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: ctaRef.current,
              start: 'top bottom',
              end: 'bottom bottom',
              scrub: 1,
            },
          }
        );
      }

      // Frosted Card Zoom & Blur Reveal
      if (ctaCardRef.current && ctaRef.current) {
        gsap.fromTo(
          ctaCardRef.current,
          { y: 80, scale: 0.94, opacity: 0, filter: 'blur(10px)' },
          {
            y: 0,
            scale: 1.0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: ctaRef.current,
              start: 'top 60%',
            },
          }
        );
      }
    }, ctaRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="download"
      ref={ctaRef}
      className="cta relative min-h-[780px] py-20 md:py-28 overflow-hidden bg-white select-none flex items-center justify-center"
    >
      {/* Night Panorama with Mask */}
      <div
        className="cta-img absolute left-0 right-0 bottom-0 h-[86%] pointer-events-none overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, #000 24%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 24%)',
        }}
        aria-hidden="true"
      >
        <img
          id="ctaImg"
          ref={ctaImgRef}
          src={NIGHT_IMAGE}
          alt="Moonlit cherry blossom valley"
          className="w-full h-[118%] object-cover object-[center_60%]"
        />
      </div>

      {/* Falling Cherry Blossom Petals */}
      <div
        id="petals"
        ref={petalsRef}
        className="petals absolute inset-0 z-10 pointer-events-none overflow-hidden"
        aria-hidden="true"
      />

      {/* Floating Frosted White Card */}
      <div
        id="ctaCard"
        ref={ctaCardRef}
        className="cta-card relative z-20 w-[min(740px,calc(100%-32px))] p-6 sm:p-10 text-center rounded-[28px] border border-white/70 backdrop-blur-[18px] shadow-[0_30px_60px_rgba(10,20,60,0.18)]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,0.3) 100%)',
        }}
      >
        <span className="pill mb-3">
          GET MARDUK
        </span>

        <h2 className="text-2xl sm:text-4xl md:text-[36px] font-normal tracking-tight text-[#121410] leading-tight mt-2 mb-2.5">
          Your next benchmark starts on your desktop.
        </h2>

        <p className="text-xs sm:text-sm text-[#2b3323] max-w-lg mx-auto mb-6 leading-relaxed font-normal">
          Choose the installer for your operating system. The desktop app performs hardware discovery and benchmarks locally.
        </p>

        {/* Platform Selector Tabs */}
        <div className="flex items-center justify-center gap-2 p-1 bg-white/70 backdrop-blur-md rounded-full max-w-md mx-auto mb-6 border border-[#eef0ea]">
          <button
            onClick={() => setSelectedPlatform('windows')}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedPlatform === 'windows'
                ? 'bg-[#4d6a10] text-[#f3f8e4] shadow-sm'
                : 'text-[#4d5642] hover:text-[#121410]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Windows</span>
          </button>
          <button
            onClick={() => setSelectedPlatform('macos')}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedPlatform === 'macos'
                ? 'bg-[#4d6a10] text-[#f3f8e4] shadow-sm'
                : 'text-[#4d5642] hover:text-[#121410]'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>macOS</span>
          </button>
          <button
            onClick={() => setSelectedPlatform('linux')}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedPlatform === 'linux'
                ? 'bg-[#4d6a10] text-[#f3f8e4] shadow-sm'
                : 'text-[#4d5642] hover:text-[#121410]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Linux</span>
          </button>
        </div>

        {/* Platform Content Card */}
        {selectedPlatform === 'windows' && (
          <div className="bg-white/90 rounded-2xl p-5 border border-white/80 shadow-sm text-left max-w-xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eef0ea]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#4d6a10] uppercase tracking-wide">
                  Release v0.1.0 • Verified x64 Binary
                </span>
                <h3 className="text-base font-bold text-[#121410]">
                  MARDUK Desktop for Windows (x64)
                </h3>
              </div>
              <a
                href="https://github.com/Aadrit555/Marduk/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="btn h-[38px] px-6 text-xs font-semibold inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download for Windows</span>
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-[11px]">
              <div>
                <span className="text-[#6d7960] block">Version</span>
                <strong className="text-[#121410] font-mono">0.1.0</strong>
              </div>
              <div>
                <span className="text-[#6d7960] block">Format</span>
                <strong className="text-[#121410]">Portable .exe</strong>
              </div>
              <div>
                <span className="text-[#6d7960] block">File Size</span>
                <strong className="text-[#121410] font-mono">16.25 MB</strong>
              </div>
              <div>
                <span className="text-[#6d7960] block">Target OS</span>
                <strong className="text-[#121410]">Windows 10/11</strong>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#f0f2ea] flex items-center justify-between gap-2 text-[10px] text-[#556149]">
              <div className="truncate font-mono">
                SHA-256: <span className="text-[#121410]">{winSha.slice(0, 24)}...</span>
              </div>
              <button
                onClick={() => copyToClipboard(winSha)}
                className="inline-flex items-center gap-1 text-[#4d6a10] hover:underline cursor-pointer bg-transparent border-none p-0 text-[10px] font-medium shrink-0"
              >
                {copiedSha ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSha ? 'Copied' : 'Copy Checksum'}</span>
              </button>
            </div>
          </div>
        )}

        {(selectedPlatform === 'macos' || selectedPlatform === 'linux') && (
          <div className="bg-white/90 rounded-2xl p-6 border border-white/80 shadow-sm text-center max-w-xl mx-auto mb-6">
            <div className="w-10 h-10 rounded-full bg-[#f0f3eb] flex items-center justify-center mx-auto mb-3 text-[#4d6a10]">
              {selectedPlatform === 'macos' ? <Laptop className="w-5 h-5" /> : <Terminal className="w-5 h-5" />}
            </div>
            <h3 className="text-base font-bold text-[#121410] mb-1.5">
              Desktop builds are not published yet.
            </h3>
            <p className="text-xs text-[#4d5642] leading-relaxed max-w-md mx-auto mb-4 font-normal">
              MARDUK is in active development. Installer downloads for {selectedPlatform === 'macos' ? 'macOS (Apple Silicon)' : 'Linux (x86_64)'} will appear here after each platform build has been tested and published.
            </p>
            <div className="inline-flex items-center gap-2 text-[11px] font-mono text-[#4d6a10] bg-[#e7efcf] px-3 py-1 rounded-full">
              <span>Status: In Active Validation</span>
            </div>
          </div>
        )}

        {/* Developer source build hint */}
        <div className="text-[11px] sm:text-xs text-[#3d4930] flex flex-wrap items-center justify-center gap-2 pt-2">
          <span>Building from source?</span>
          <code className="font-mono bg-white/70 px-2 py-0.5 rounded border border-[#d8decb] text-[#121410]">
            cargo run -p marduk-desktop
          </code>
          <a
            href="https://github.com/Aadrit555/Marduk#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#4d6a10] hover:underline font-semibold ml-1"
          >
            <span>View Build Guide</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  );
};
