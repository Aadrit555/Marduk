import React, { useState, useEffect } from 'react';
import { ShieldCheck, Terminal, HardDrive, Copy, Check } from 'lucide-react';
import { SystemTelemetry } from '../types';

interface DiagnosticsTabProps {
  telemetry: SystemTelemetry | null;
}

export const DiagnosticsTab: React.FC<DiagnosticsTabProps> = ({ telemetry }) => {
  const [metricsText, setMetricsText] = useState<string>('Loading Prometheus metrics...');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/metrics')
      .then((r) => r.text())
      .then((text) => setMetricsText(text))
      .catch((err) => setMetricsText(`Failed to fetch /metrics: ${err}`));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(metricsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-violet-400" />
          Diagnostics, Host Telemetry & Raw Metrics
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Low-level operating system state, hardware topology, and standard Prometheus exposition metrics.
        </p>
      </div>

      {/* Host Node Specs */}
      <div className="glass-panel p-6">
        <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          Host Node Infrastructure Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Hostname</span>
            <div className="font-mono font-bold text-white mt-1">{telemetry?.hostname || 'localhost'}</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Operating System</span>
            <div className="font-mono font-bold text-white mt-1 truncate">{telemetry?.os_name || 'Windows 11'}</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">CPU Compute</span>
            <div className="font-mono font-bold text-white mt-1">
              {telemetry?.cpu_count || 0} Cores ({telemetry?.cpu_usage_percent.toFixed(1) || 0}% load)
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Host RAM Allocation</span>
            <div className="font-mono font-bold text-white mt-1">
              {telemetry
                ? `${(telemetry.system_memory_used_bytes / (1024 * 1024)).toFixed(0)} MB / ${(
                    telemetry.system_memory_total_bytes / (1024 * 1024)
                  ).toFixed(0)} MB`
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Prometheus Raw Exposition */}
      <div className="glass-panel p-6 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Prometheus Exposition Telemetry (GET /metrics)
          </h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-300 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed">
          {metricsText}
        </pre>
      </div>
    </div>
  );
};
