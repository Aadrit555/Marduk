import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Download, Monitor, Laptop, Terminal, Copy, Check, Clock, ShieldCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface FallingPetalsCtaProps {
  onOpenControlCenter?: () => void;
}

const NIGHT_IMAGE =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093217_cc690198-ad8c-4127-8734-8485bd878351.png';

import {
  DIRECT_WINDOWS_DOWNLOAD,
  WIN_FILENAME,
  WIN_SHA256,
  WIN_FILE_SIZE,
  APP_VERSION,
  detectVisitorOS,
  type OperatingSystem,
} from '../constants/downloads';

export {
  DIRECT_WINDOWS_DOWNLOAD,
  WIN_FILENAME,
  WIN_SHA256,
  WIN_FILE_SIZE,
  APP_VERSION,
};

export const FallingPetalsCta: React.FC<FallingPetalsCtaProps> = () => {
  const ctaRef = useRef<HTMLElement>(null);
  const ctaImgRef = useRef<HTMLImageElement>(null);
  const ctaCardRef = useRef<HTMLDivElement>(null);
  const petalsRef = useRef<HTMLDivElement>(null);

  const [selectedPlatform, setSelectedPlatform] = useState<OperatingSystem>('windows');
  const [detectedOs, setDetectedOs] = useState<string>('Windows');
  const [copiedSha, setCopiedSha] = useState<boolean>(false);

  // 1. Auto-detect visitor's operating system
  useEffect(() => {
    const detected = detectVisitorOS();
    setSelectedPlatform(detected.os);
    if (detected.os === 'macos-arm' || detected.os === 'macos-intel') {
      setDetectedOs('macOS');
    } else if (detected.os === 'linux') {
      setDetectedOs('Linux');
    } else {
      setDetectedOs('Windows');
    }
  }, []);

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
      className="cta relative min-h-[820px] py-20 md:py-28 overflow-hidden bg-white select-none flex items-center justify-center"
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
        className="cta-card relative z-20 w-[min(760px,calc(100%-32px))] p-6 sm:p-10 text-center rounded-[28px] border border-white/70 backdrop-blur-[18px] shadow-[0_30px_60px_rgba(10,20,60,0.18)]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,0.3) 100%)',
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <img
            src="/icon.png"
            alt="MARDUK Icon"
            className="w-7 h-7 rounded-lg shadow-sm border border-[#b4cd52]/50 object-cover"
          />
          <span className="pill">
            GET MARDUK • DETECTED {detectedOs.toUpperCase()}
          </span>
        </div>

        <h2 className="text-2xl sm:text-4xl md:text-[36px] font-normal tracking-tight text-[#121410] leading-tight mt-1 mb-2">
          Your next benchmark starts on your desktop.
        </h2>

        <p className="text-xs sm:text-sm text-[#2b3323] max-w-lg mx-auto mb-6 leading-relaxed font-normal">
          Click below to initiate the direct application download for your system. Hardware tests execute locally with real physical measurement.
        </p>

        {/* Platform Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-white/70 backdrop-blur-md rounded-full max-w-xl mx-auto mb-6 border border-[#eef0ea]">
          <button
            onClick={() => setSelectedPlatform('windows')}
            className={`py-1.5 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedPlatform === 'windows'
                ? 'bg-[#4d6a10] text-[#f3f8e4] shadow-sm'
                : 'text-[#4d5642] hover:text-[#121410]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Windows x64</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-mono ml-0.5">Ready</span>
          </button>

          <button
            onClick={() => setSelectedPlatform('macos-arm')}
            className={`py-1.5 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedPlatform === 'macos-arm'
                ? 'bg-[#4d6a10] text-[#f3f8e4] shadow-sm'
                : 'text-[#4d5642] hover:text-[#121410]'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>macOS Apple Silicon</span>
          </button>

          <button
            onClick={() => setSelectedPlatform('macos-intel')}
            className={`py-1.5 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedPlatform === 'macos-intel'
                ? 'bg-[#4d6a10] text-[#f3f8e4] shadow-sm'
                : 'text-[#4d5642] hover:text-[#121410]'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>macOS Intel</span>
          </button>

          <button
            onClick={() => setSelectedPlatform('linux')}
            className={`py-1.5 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedPlatform === 'linux'
                ? 'bg-[#4d6a10] text-[#f3f8e4] shadow-sm'
                : 'text-[#4d5642] hover:text-[#121410]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Linux x86_64</span>
          </button>
        </div>

        {/* Platform Content Card: Windows x64 (Direct compiled installer download) */}
        {selectedPlatform === 'windows' && (
          <div className="bg-white/95 rounded-2xl p-5 sm:p-6 border border-white/80 shadow-sm text-left max-w-xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eef0ea]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold text-[#4d6a10] uppercase tracking-wide bg-[#e7efcf] px-2 py-0.5 rounded-full">
                    {APP_VERSION} • Published Installer
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified Non-Empty
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#121410]">
                  MARDUK-Setup-x64.exe
                </h3>
                <p className="text-xs text-[#525f46]">
                  Cross-platform hardware benchmarking desktop application
                </p>
              </div>

              {/* Direct Download Initiator: Clicking immediately downloads the file */}
              <a
                href={DIRECT_WINDOWS_DOWNLOAD}
                download="MARDUK-Setup-x64.exe"
                className="btn h-[42px] px-7 text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download MARDUK</span>
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5 text-[11px]">
              <div>
                <span className="text-[#6d7960] block">Version</span>
                <strong className="text-[#121410] font-mono">{APP_VERSION}</strong>
              </div>
              <div>
                <span className="text-[#6d7960] block">Package Format</span>
                <strong className="text-[#121410]">Executable (.exe)</strong>
              </div>
              <div>
                <span className="text-[#6d7960] block">File Size</span>
                <strong className="text-[#121410] font-mono">{WIN_FILE_SIZE}</strong>
              </div>
              <div>
                <span className="text-[#6d7960] block">Operating System</span>
                <strong className="text-[#121410]">Windows 10/11 x64</strong>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-[#f0f2ea] flex items-center justify-between gap-2 text-[10.5px] text-[#556149]">
              <div className="truncate font-mono">
                SHA-256: <span className="text-[#121410] font-semibold">{WIN_SHA256.slice(0, 28)}...</span>
              </div>
              <button
                onClick={() => copyToClipboard(WIN_SHA256)}
                className="inline-flex items-center gap-1 text-[#4d6a10] hover:underline cursor-pointer bg-transparent border-none p-0 text-[10.5px] font-medium shrink-0"
              >
                {copiedSha ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSha ? 'Copied' : 'Copy Checksum'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Platform Content Card: macOS Apple Silicon (COMING SOON) */}
        {selectedPlatform === 'macos-arm' && (
          <div className="bg-white/95 rounded-2xl p-6 border border-white/80 shadow-sm text-center max-w-xl mx-auto mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#f0f3eb] flex items-center justify-center mx-auto mb-3 text-[#4d6a10]">
              <Laptop className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/80 mb-2">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>COMING SOON</span>
            </div>
            <h3 className="text-base font-bold text-[#121410] mb-1">
              MARDUK-macos-arm64.dmg
            </h3>
            <p className="text-xs text-[#4d5642] leading-relaxed max-w-md mx-auto mb-4 font-normal">
              The Apple Silicon (M1/M2/M3/M4) package is undergoing notarization. The direct download installer will appear here once validation completes.
            </p>
            <div className="pt-3 border-t border-[#f0f2ea] flex items-center justify-between text-xs text-[#525f46]">
              <span>Architecture: Apple Silicon (ARM64)</span>
              <a
                href={DIRECT_WINDOWS_DOWNLOAD}
                download="MARDUK-Setup-x64.exe"
                className="text-[#4d6a10] font-semibold hover:underline"
              >
                Download Windows x64 ({WIN_FILE_SIZE})
              </a>
            </div>
          </div>
        )}

        {/* Platform Content Card: macOS Intel (COMING SOON) */}
        {selectedPlatform === 'macos-intel' && (
          <div className="bg-white/95 rounded-2xl p-6 border border-white/80 shadow-sm text-center max-w-xl mx-auto mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#f0f3eb] flex items-center justify-center mx-auto mb-3 text-[#4d6a10]">
              <Laptop className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/80 mb-2">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>COMING SOON</span>
            </div>
            <h3 className="text-base font-bold text-[#121410] mb-1">
              MARDUK-macos-x64.dmg
            </h3>
            <p className="text-xs text-[#4d5642] leading-relaxed max-w-md mx-auto mb-4 font-normal">
              The macOS Intel x86_64 installer will be published following Apple Silicon release validation.
            </p>
            <div className="pt-3 border-t border-[#f0f2ea] flex items-center justify-between text-xs text-[#525f46]">
              <span>Architecture: Intel x86_64</span>
              <a
                href={DIRECT_WINDOWS_DOWNLOAD}
                download="MARDUK-Setup-x64.exe"
                className="text-[#4d6a10] font-semibold hover:underline"
              >
                Download Windows x64 ({WIN_FILE_SIZE})
              </a>
            </div>
          </div>
        )}

        {/* Platform Content Card: Linux (COMING SOON) */}
        {selectedPlatform === 'linux' && (
          <div className="bg-white/95 rounded-2xl p-6 border border-white/80 shadow-sm text-center max-w-xl mx-auto mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#f0f3eb] flex items-center justify-center mx-auto mb-3 text-[#4d6a10]">
              <Terminal className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/80 mb-2">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>COMING SOON</span>
            </div>
            <h3 className="text-base font-bold text-[#121410] mb-1">
              MARDUK-linux-x86_64.AppImage
            </h3>
            <p className="text-xs text-[#4d5642] leading-relaxed max-w-md mx-auto mb-4 font-normal">
              Linux desktop installer package is undergoing testing on glibc 2.31+ distributions.
            </p>
            <div className="pt-3 border-t border-[#f0f2ea] flex items-center justify-between text-xs text-[#525f46]">
              <span>Architecture: Linux x86_64</span>
              <a
                href={DIRECT_WINDOWS_DOWNLOAD}
                download="MARDUK-Setup-x64.exe"
                className="text-[#4d6a10] font-semibold hover:underline"
              >
                Download Windows x64 ({WIN_FILE_SIZE})
              </a>
            </div>
          </div>
        )}

        {/* Direct Download Note */}
        <p className="text-[11px] sm:text-xs text-[#3d4930] max-w-md mx-auto font-medium">
          Clicking Download directly streams the compiled application installer to your machine. No account, registration, or external redirects required.
        </p>
      </div>
    </section>
  );
};
