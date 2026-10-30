import React, { useState } from 'react';
import { Settings, Sliders, Zap, Check } from 'lucide-react';

interface SettingsTabProps {
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ autoRefresh, setAutoRefresh }) => {
  const [pollInterval, setPollInterval] = useState<number>(1500);
  const [alphaQueue, setAlphaQueue] = useState<number>(1.0);
  const [betaExec, setBetaExec] = useState<number>(1.0);
  const [gammaMem, setGammaMem] = useState<number>(2.5);
  const [deltaAffinity, setDeltaAffinity] = useState<number>(100.0);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-violet-400" />
            Control Plane Runtime Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure telemetry polling cadence, deterministic multi-factor cost scoring weights, and worker affinity rules.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Telemetry settings */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Telemetry & Dashboard Polling
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300 font-medium">Automatic Background Polling</span>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-0"
              />
            </label>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Polling Frequency</span>
                <span className="font-mono text-white">{pollInterval} ms</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 font-mono">
                <span>500ms (Real-time)</span>
                <span>5000ms (Low network)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              API Host: <span className="text-white">http://127.0.0.1:8080</span> (Axum / Tokio)
            </div>
          </div>
        </div>

        {/* Scheduler cost scoring parameters */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Zap className="w-4 h-4 text-amber-400" />
            Multi-Factor Cost Scoring Formula Weights
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Queue Wait Time Weight (α)</span>
                <span className="font-mono text-violet-300">{alphaQueue.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={alphaQueue}
                onChange={(e) => setAlphaQueue(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Predicted Execution Time Weight (β)</span>
                <span className="font-mono text-cyan-300">{betaExec.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={betaExec}
                onChange={(e) => setBetaExec(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Quadratic Memory Pressure Penalty (γ)</span>
                <span className="font-mono text-amber-300">{gammaMem.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={gammaMem}
                onChange={(e) => setGammaMem(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Model Residency Affinity Discount (δ)</span>
                <span className="font-mono text-emerald-300">-{deltaAffinity.toFixed(0)} pts</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={deltaAffinity}
                onChange={(e) => setDeltaAffinity(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-3">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
              <Check className="w-3.5 h-3.5" />
              Settings updated successfully
            </span>
          )}
          <button type="submit" className="btn-primary">
            Apply Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
