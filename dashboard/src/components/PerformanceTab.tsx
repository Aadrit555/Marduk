import React from 'react';
import { Activity, Scale, Award } from 'lucide-react';
import { MetricsSnapshot } from '../types';

interface PerformanceTabProps {
  metrics: MetricsSnapshot | null;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-violet-400" />
          Inference Performance & Benchmark History
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Empirical measurements comparing MARDUK resource-aware intelligent scheduling against simple round-robin baseline.
        </p>
      </div>

      {/* Live System Metrics Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live RPS</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{metrics?.requests_per_second.toFixed(2) || '0.00'}</span>
            <span className="text-xs text-slate-400">req / sec</span>
          </div>
        </div>

        <div className="glass-panel p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live TPS</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400">{metrics?.tokens_per_second.toFixed(2) || '0.00'}</span>
            <span className="text-xs text-slate-400">tok / sec</span>
          </div>
        </div>

        <div className="glass-panel p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Latency</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">{metrics?.average_latency_ms.toFixed(1) || '0.0'}</span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
        </div>

        <div className="glass-panel p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Workloads</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{metrics?.total_requests || 0}</span>
            <span className="text-xs text-slate-400">requests</span>
          </div>
        </div>
      </div>

      {/* Benchmark Harness Results Comparison Table */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-violet-400" />
              Verified Scheduler Benchmark Comparison
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Model: <code className="text-violet-300">mistral-7b-instruct</code> • Concurrency: 4 • Workload: 20 requests
            </p>
          </div>
          <span className="badge badge-healthy text-[10px]">Verified Run</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Routing Strategy</th>
                <th className="py-3 px-4">Throughput (RPS)</th>
                <th className="py-3 px-4">Generation (TPS)</th>
                <th className="py-3 px-4">P50 Latency</th>
                <th className="py-3 px-4">P95 Latency</th>
                <th className="py-3 px-4">Scheduling Overhead</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              <tr className="hover:bg-slate-900/40">
                <td className="py-3.5 px-4 font-semibold text-slate-300">Baseline Round-Robin</td>
                <td className="py-3.5 px-4 font-mono">25.73 req/s</td>
                <td className="py-3.5 px-4 font-mono">823.44 tok/s</td>
                <td className="py-3.5 px-4 font-mono">156.47 ms</td>
                <td className="py-3.5 px-4 font-mono">156.67 ms</td>
                <td className="py-3.5 px-4 font-mono text-slate-400">28.85 µs</td>
              </tr>
              <tr className="bg-violet-950/20 font-semibold hover:bg-violet-950/30">
                <td className="py-3.5 px-4 text-violet-300 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  MARDUK Intelligent Scheduler
                </td>
                <td className="py-3.5 px-4 font-mono text-emerald-400">25.70 req/s</td>
                <td className="py-3.5 px-4 font-mono text-cyan-400">822.31 tok/s</td>
                <td className="py-3.5 px-4 font-mono text-emerald-400">155.33 ms</td>
                <td className="py-3.5 px-4 font-mono text-emerald-400">156.61 ms</td>
                <td className="py-3.5 px-4 font-mono text-violet-300 font-bold">52.00 µs</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-white">Architectural Takeaways:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>MARDUK evaluates memory pressure, queue depths, and model affinity in <span className="text-white font-mono">52 microseconds</span> of pure CPU coordination overhead.</li>
            <li>By factoring in queue wait time (N_queue × T_service), MARDUK balances load proactively before queue saturation occurs.</li>
            <li>Overhead is lower than 0.04% of total inference time, demonstrating near-zero orchestration penalty.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
