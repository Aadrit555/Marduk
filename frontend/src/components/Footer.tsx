import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Github, BookOpen } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface FooterProps {
  onOpenControlCenter: (tab?: string) => void;
}

export const Footer: React.FC<FooterProps> = () => {
  const footerRef = useRef<HTMLElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const markRef = useRef<SVGPathElement>(null);
  const dotsRef = useRef<SVGCircleElement[]>([]);

  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) {
      if (ringRef.current) ringRef.current.style.strokeDashoffset = '0';
      if (markRef.current) markRef.current.style.strokeDashoffset = '0';
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 92%',
        },
      });

      // 3 dots bounce
      tl.to(dotsRef.current, {
        y: -8,
        duration: 0.25,
        stagger: 0.08,
        yoyo: true,
        repeat: 3,
        ease: 'sine.inOut',
      });

      // Merge dots to cx 27, cy 50
      tl.to(
        dotsRef.current,
        {
          attr: { cx: 27, cy: 50 },
          duration: 0.45,
          ease: 'power3.inOut',
        },
        '+=0.1'
      );

      // Fade out dots 2 & 3
      if (dotsRef.current[1] && dotsRef.current[2]) {
        tl.to([dotsRef.current[1], dotsRef.current[2]], { opacity: 0, duration: 0.1 });
      }

      // Draw SVG Mark
      if (markRef.current) {
        tl.to(
          markRef.current,
          {
            strokeDashoffset: 0,
            duration: 0.6,
            ease: 'power3.out',
          },
          '-=0.05'
        );
      }

      // Draw Ring
      if (ringRef.current) {
        tl.to(
          ringRef.current,
          {
            strokeDashoffset: 0,
            duration: 0.9,
            ease: 'power2.inOut',
          },
          '-=0.3'
        );
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      id="footer"
      ref={footerRef}
      className="bg-[#b4cd52] text-[#121410] px-6 sm:px-12 py-10 sm:py-12 select-none"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-[#9ebf35]/50">
        {/* Official Brand Logo */}
        <div className="flex items-center gap-4">
          <img
            src="/icon.png"
            alt="MARDUK Logo"
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl shadow-md border border-[#9ebf35]/60 object-cover"
          />

          <div>
            <span className="font-extrabold text-xl tracking-tight block">MARDUK</span>
            <span className="text-xs text-[#2a3410] font-semibold block">
              Know what your machine can really do.
            </span>
            <span className="text-[11px] text-[#3e4c19] block mt-0.5">
              Cross-platform CPU, GPU, memory and local AI inference benchmarking.
            </span>
          </div>
        </div>

        {/* Links Navigation */}
        <nav
          aria-label="Footer Navigation"
          className="flex flex-wrap items-center justify-center gap-5 text-xs sm:text-[13px] font-semibold text-[#1d240c]"
        >
          <a href="#download" className="hover:underline">
            Download
          </a>
          <a
            href="https://github.com/Aadrit555/Marduk#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Documentation
          </a>
          <a
            href="#download"
            className="hover:underline"
          >
            Release notes
          </a>
          <a href="#compatibility" className="hover:underline">
            Hardware support
          </a>
          <a href="#benchmarks" className="hover:underline">
            Benchmark methodology
          </a>
          <a href="#safety" className="hover:underline">
            Privacy
          </a>
          <a
            href="https://github.com/Aadrit555/Marduk"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            GitHub
          </a>
        </nav>

        {/* Social / Repositories */}
        <div className="flex items-center gap-4 text-[#121410]">
          <a
            href="https://github.com/Aadrit555/Marduk"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="p-2 rounded-full hover:bg-black/10 transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href="https://github.com/Aadrit555/Marduk#readme"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Documentation"
            className="p-2 rounded-full hover:bg-black/10 transition-colors"
          >
            <BookOpen className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-6xl mx-auto pt-6 text-center text-[11px] text-[#2a330f] font-medium">
        © 2026 Aadrit / MARDUK Project. Cross-platform CPU, GPU, memory and local AI inference benchmarking. All rights reserved.
      </div>
    </footer>
  );
};
