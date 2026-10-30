import React from 'react';
import { Layers } from 'lucide-react';
import { ModelInfo, WorkerInfo } from '../types';

interface ModelManagementTabProps {
  models: ModelInfo[];
  workers: WorkerInfo[];
}

export const ModelManagementTab: React.FC<ModelManagementTabProps> = ({ models, workers }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Model Registry & Resource Allocation
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered generative AI models, parameter sizes, VRAM budgets, and active worker host assignments.
          </p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Model ID</th>
                <th className="py-3 px-4">Display Name</th>
                <th className="py-3 px-4">Family</th>
                <th className="py-3 px-4">Parameters</th>
                <th className="py-3 px-4">Context</th>
                <th className="py-3 px-4">Quantization</th>
                <th className="py-3 px-4">Est. VRAM</th>
                <th className="py-3 px-4">Resident Workers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {models.map((m) => {
                const assignedWorkers = workers.filter((w) => w.loaded_model === m.id);

                return (
                  <tr key={m.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-violet-400">{m.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{m.name}</td>
                    <td className="py-3.5 px-4 uppercase text-[11px] font-mono text-slate-400">{m.family}</td>
                    <td className="py-3.5 px-4 font-mono">{m.parameter_count_billions.toFixed(1)}B</td>
                    <td className="py-3.5 px-4 font-mono">{(m.context_window / 1024).toFixed(0)}K</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{m.default_quantization}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{m.estimated_vram_mb} MB</td>
                    <td className="py-3.5 px-4">
                      {assignedWorkers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {assignedWorkers.map((w) => (
                            <span key={w.id} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono text-[10px]">
                              {w.id} (GPU {w.assigned_device_id})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Not resident in VRAM</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
