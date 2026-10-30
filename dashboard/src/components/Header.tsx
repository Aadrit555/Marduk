import React from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Server,
  RefreshCw,
  Zap,
  ShieldCheck,
  Send,
  Scale,
  Settings,
  Compass,
} from 'lucide-react';
import { HealthResponse } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: HealthResponse | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onBackToPortal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  health,
  onRefresh,
  isRefreshing,
  onBackToPortal,
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'gpus', label: 'GPU Monitoring', icon: Cpu },
    { id: 'workers', label: 'Workers', icon: Server },
    { id: 'models', label: 'Models', icon: Activity },
    { id: 'scheduler', label: 'Scheduler', icon: Zap },
    { id: 'requests', label: 'Requests', icon: Send },
    { id: 'benchmarks', label: 'Benchmarks', icon: Scale },
    { id: 'logs', label: 'Logs', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToPortal}
            title="Return to Glyph Portal"
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20 cursor-pointer border-none"
          >
            <Zap className="w-6 h-6 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                MARDUK
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                v0.1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Intelligent GPU Inference Orchestrator</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm shadow-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Health status & actions */}
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-all"
              title="Return to Glyph Portal introduction"
            >
              <Compass className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Portal</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                health?.status === 'ok' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {health?.nvml_available ? 'NVML Active' : 'CPU Mode'}
            </span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all disabled:opacity-50"
            title="Refresh live telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-violet-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
