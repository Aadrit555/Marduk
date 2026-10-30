import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 py-12 px-6 text-xs text-zinc-400 bg-[#040305]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-redshift-600/20 border border-redshift-500/40 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-redshift-400" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <span className="font-bold text-white tracking-wide">MARDUK REDSHIFT</span>
          <span className="text-zinc-500">v0.1.0</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="https://github.com/Aadrit555/Marduk" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
            GitHub
          </a>
          <a href="#hero" className="hover:text-white transition-colors">
            Back to Top
          </a>
          <span className="text-zinc-400">Daemon: 127.0.0.1:8080</span>
        </div>

        <div className="text-zinc-400 font-mono text-[11px]">
          Design inspired by Peakline Redshift
        </div>
      </div>
    </footer>
  );
};
