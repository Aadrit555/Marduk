import React, { useState, useEffect } from 'react';
import { HealthStatus } from '../api';
import { Menu, X, Download, Activity } from 'lucide-react';
import {
  DIRECT_WINDOWS_DOWNLOAD,
  WIN_FILENAME,
  detectVisitorOS,
} from '../constants/downloads';

interface NavbarProps {
  health: HealthStatus | null;
  connectionState: 'connected' | 'connecting' | 'disconnected';
  onOpenControlCenter: (tab?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  connectionState,
  onOpenControlCenter,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isWindows, setIsWindows] = useState(true);

  useEffect(() => {
    setIsWindows(detectVisitorOS().os === 'windows');
  }, []);

  const getStatusBadge = () => {
    if (connectionState === 'connecting') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Probing
        </span>
      );
    }
    if (connectionState === 'connected' && health) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#e7efcf] text-[#2c3a10] border border-[#d2dfab]/70">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6f9a0c]" />
          {health.nvml_available ? 'NVIDIA & CPU Active' : 'CPU Engine Active'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#f0f2eb] text-[#4d5642] border border-[#dce2d4]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#829175]" />
        Desktop Ready
      </span>
    );
  };

  const navLinks = [
    { label: 'Product', href: '#product' },
    { label: 'Benchmarks', href: '#benchmarks' },
    { label: 'Compatibility', href: '#compatibility' },
    { label: 'Safety', href: '#safety' },
    { label: 'Documentation', href: '#docs' },
    { label: 'Releases', href: '#download' },
  ];

  return (
    <>
      <header className="fixed top-[22px] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-5xl">
        <nav
          aria-label="Primary Navigation"
          className="nav flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_6px_20px_rgba(0,0,0,0.06)] border border-white/60 transition-all duration-300"
        >
          {/* Brand Link */}
          <a
            href="#hero"
            aria-label="MARDUK home"
            className="brand flex items-center gap-2.5 text-xl font-medium tracking-tight text-[#121410] hover:opacity-85 transition-opacity"
          >
            <img
              src="/icon.png"
              alt="MARDUK Icon"
              className="w-6 h-6 rounded-md object-cover shadow-sm border border-[#d2dfab]/60"
            />
            <span className="font-semibold lowercase tracking-tight">marduk</span>
          </a>

          {/* Center Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-[#2b2e27]">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-[#4d6a10] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">{getStatusBadge()}</div>

            <a
              href={isWindows ? DIRECT_WINDOWS_DOWNLOAD : '#download'}
              {...(isWindows ? { download: WIN_FILENAME } : {})}
              className="btn text-xs sm:text-[13px]"
              aria-label="Download MARDUK Desktop"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download MARDUK
            </a>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#121410] hover:bg-neutral-100 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute top-20 left-4 right-4 bg-white rounded-3xl p-6 shadow-2xl border border-neutral-100 flex flex-col gap-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#eef0ea]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6f9a0c]">
                Navigation
              </span>
              {getStatusBadge()}
            </div>

            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-[#121410] hover:text-[#4d6a10] py-1.5 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={isWindows ? DIRECT_WINDOWS_DOWNLOAD : '#download'}
                {...(isWindows ? { download: WIN_FILENAME } : {})}
                onClick={() => setMobileMenuOpen(false)}
                className="btn w-full justify-center text-sm"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download MARDUK
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenControlCenter();
                }}
                className="btn-secondary w-full justify-center text-sm"
              >
                <Activity className="w-4 h-4 mr-1.5 text-[#4d6a10]" />
                Hardware Console
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
