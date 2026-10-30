import React from 'react';
import { Cpu, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  onOpenDashboard: () => void;
  activeSection: string;
  setActiveSection: (sec: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDashboard,
  activeSection,
  setActiveSection,
}) => {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 py-3.5 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#050507]/85 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/80'
          : 'bg-transparent'
      }`}
    >
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <a href="#hero" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-redshift-600 via-redshift-500 to-amber-500 p-0.5 shadow-lg shadow-redshift-600/30 group-hover:shadow-redshift-600/50 transition-all">
            <div className="w-full h-full bg-[#09080a] rounded-[6px] flex items-center justify-center">
              <svg className="w-4 h-4 text-redshift-400" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white group-hover:text-redshift-200 transition-colors">
              MARDUK
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              Redshift Core
            </span>
          </div>
        </a>
      </div>

      {/* Nav Pill */}
      <nav className="hidden md:flex items-center gap-1 px-4 py-1.5 rounded-full glass-pill text-xs font-medium text-zinc-300 shadow-xl shadow-black/40">
        {[
          { id: 'hero', label: 'Platform' },
          { id: 'cluster', label: 'Cluster' },
          { id: 'scheduler', label: 'Scheduler' },
          { id: 'telemetry', label: 'Hardware' },
          { id: 'playground', label: 'Inference' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveSection(item.id);
              document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`px-3 py-1.5 rounded-full transition-all duration-200 ${
              activeSection === item.id
                ? 'bg-white/10 text-white font-semibold'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Hardware Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950/80 border border-zinc-800 text-[11px] font-mono text-zinc-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-redshift-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-redshift-500"></span>
          </span>
          <Cpu className="w-3 h-3 text-redshift-400" />
          <span>NVML ACTIVE</span>
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={onOpenDashboard}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-xs text-black bg-white hover:bg-zinc-200 transition-all shadow-lg hover:shadow-white/20 active:scale-95 cursor-pointer"
        >
          <span>Control Center</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-black" />
        </button>
      </div>
    </header>
  );
};
