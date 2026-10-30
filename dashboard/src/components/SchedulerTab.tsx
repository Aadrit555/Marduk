import React, { useState } from 'react';
import { Zap, ChevronDown, ChevronRight, CheckCircle2, Scale, ShieldAlert } from 'lucide-react';
import { SchedulingDecision } from '../types';

interface SchedulerTabProps {
  decisions: SchedulingDecision[];
}

export const SchedulerTab: React.FC<SchedulerTabProps> = ({ decisions }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Intelligent Scheduler Decision Stream
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent, explainable routing decisions with candidate evaluations, cost scores, and constraint checks.
          </p>
        </div>
      </div>

      {decisions.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-3">
          <Zap className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-semibold text-slate-300 text-sm">No Decisions Logged Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Inference requests dispatched to the platform will be scheduled and transparently audited here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {decisions.map((d) => {
            const isExpanded = expandedId === d.decision_id;

            return (
              <div key={d.decision_id} className="glass-panel p-5 space-y-4">
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => toggleExpand(d.decision_id)}
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-white">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">{d.request_id}</span>
                        <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono text-xs border border-violet-500/30">
                          {d.model}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Dispatched to <span className="text-emerald-400 font-semibold">{d.selected_worker_id}</span> on GPU {d.assigned_device_id}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs text-slate-400">{new Date(d.timestamp).toLocaleTimeString()}</span>
                    <div className="mt-1">
                      <span className="badge badge-healthy text-[10px]">
                        {d.candidates_evaluated.length} Evaluated
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rationale pill */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 font-mono flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{d.rationale}</span>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="space-y-4 pt-3 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-violet-400" />
                      Candidate Scoring Matrix (Lower Cost = Optimal)
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">Candidate Worker</th>
                            <th className="py-2.5 px-3">GPU Index</th>
                            <th className="py-2.5 px-3">Queue Depth</th>
                            <th className="py-2.5 px-3">Est. Wait</th>
                            <th className="py-2.5 px-3">Est. Exec</th>
                            <th className="py-2.5 px-3">VRAM Pressure</th>
                            <th className="py-2.5 px-3">Model Resident</th>
                            <th className="py-2.5 px-3">Final Cost Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                          {d.candidates_evaluated.map((c) => {
                            const isChosen = c.worker_id === d.selected_worker_id;

                            return (
                              <tr
                                key={c.worker_id}
                                className={isChosen ? 'bg-violet-950/20 font-semibold' : 'hover:bg-slate-900/40'}
                              >
                                <td className="py-2 px-3 font-mono text-white flex items-center gap-1.5">
                                  {isChosen && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                  {c.worker_id}
                                </td>
                                <td className="py-2 px-3 font-mono">GPU {c.device_id}</td>
                                <td className="py-2 px-3 font-mono">{c.queue_depth}</td>
                                <td className="py-2 px-3 font-mono">{c.estimated_wait_ms.toFixed(1)} ms</td>
                                <td className="py-2 px-3 font-mono">{c.estimated_exec_ms.toFixed(1)} ms</td>
                                <td className="py-2 px-3 font-mono">{(c.memory_pressure * 100).toFixed(1)}%</td>
                                <td className="py-2 px-3 font-mono">
                                  {c.has_model_affinity ? (
                                    <span className="text-emerald-400">Yes (+Affinity)</span>
                                  ) : (
                                    <span className="text-slate-400">No (Cold Reload)</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-violet-300">
                                  {c.final_score.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Disqualified Candidates */}
                    {d.disqualified.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-rose-400" />
                          Disqualified Candidates (Hard Constraints)
                        </h4>
                        <div className="space-y-1.5">
                          {d.disqualified.map((dq) => (
                            <div key={dq.worker_id} className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                              <span className="font-mono font-bold text-rose-200">{dq.worker_id}:</span>
                              <span>{dq.reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
