import React, { useState } from 'react';
import { SchedulingDecision, getWorkerIdStr } from '../../api';
import { GitBranch, Clock, ChevronDown, ChevronRight, CheckCircle2, XCircle, Brain } from 'lucide-react';

interface SchedulerFeedTabProps {
  decisions: SchedulingDecision[];
}

export const SchedulerFeedTab: React.FC<SchedulerFeedTabProps> = ({ decisions }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (decisions.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-neutral-300">
        <GitBranch className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-[#121410]">No Scheduling Decisions Recorded Yet</h4>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
          The intelligent scheduler has not processed any inference requests since startup. Send a prompt via the Inference Playground to inspect live routing rationale.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#eef0ea]">
        <div>
          <h3 className="text-base font-semibold text-[#121410]">Scheduler Decision Stream</h3>
          <p className="text-xs text-neutral-500">
            Explainable multi-factor admission, queue assessment, and worker assignment records.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e7efcf] text-[#2c3a10]">
          {decisions.length} Recent Decisions
        </span>
      </div>

      <div className="space-y-3">
        {decisions.map((d) => {
          const isExpanded = expandedId === d.decision_id;
          const selectedWorkerStr = getWorkerIdStr(d.selected_worker_id);

          return (
            <div
              key={d.decision_id}
              className="p-4 rounded-2xl bg-white border border-[#eef0ea] shadow-sm hover:border-[#b4cd52] transition-all"
            >
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : d.decision_id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e7efcf] text-[#4d6a10] flex items-center justify-center flex-shrink-0">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#121410]">
                        {d.request_id}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                        {d.model}
                      </span>
                      {d.learned_prediction_used && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                          <Brain className="w-3 h-3" />
                          Learned Cost
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      Selected: <strong className="text-[#4d6a10]">{selectedWorkerStr}</strong> on GPU {d.assigned_device_id}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(d.timestamp).toLocaleTimeString()}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-neutral-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                  )}
                </div>
              </div>

              {/* Rationale Bar */}
              <div className="mt-2.5 text-xs text-[#2b2e27] bg-[#f8faf5] p-2.5 rounded-xl border border-[#eef0ea]/80 font-mono">
                <span className="text-neutral-400 select-none mr-1.5">rationale:</span>
                {d.rationale}
              </div>

              {/* Expandable Evaluation Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#f4f6f0] space-y-3 animate-fade-in text-xs">
                  {/* Candidates Evaluated */}
                  {d.candidates_evaluated.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6f9a0c]" />
                        Candidate Workers Evaluated ({d.candidates_evaluated.length})
                      </h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#eef0ea] text-[10px] uppercase text-neutral-400 font-semibold">
                              <th className="py-1 px-2">Worker</th>
                              <th className="py-1 px-2">Device</th>
                              <th className="py-1 px-2">Queue</th>
                              <th className="py-1 px-2">Wait (est)</th>
                              <th className="py-1 px-2">Exec (est)</th>
                              <th className="py-1 px-2">VRAM Press.</th>
                              <th className="py-1 px-2">Affinity</th>
                              <th className="py-1 px-2 text-right">Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {d.candidates_evaluated.map((c, i) => {
                              const cWorkerStr = getWorkerIdStr(c.worker_id);
                              const isSelected = cWorkerStr === selectedWorkerStr;

                              return (
                                <tr
                                  key={i}
                                  className={`border-b border-[#f4f6f0] text-xs font-mono ${
                                    isSelected ? 'bg-[#e7efcf]/40 font-semibold' : ''
                                  }`}
                                >
                                  <td className="py-1.5 px-2">{cWorkerStr}</td>
                                  <td className="py-1.5 px-2">GPU {c.device_id}</td>
                                  <td className="py-1.5 px-2">{c.queue_depth}</td>
                                  <td className="py-1.5 px-2">{c.estimated_wait_ms.toFixed(1)}ms</td>
                                  <td className="py-1.5 px-2">{c.estimated_exec_ms.toFixed(1)}ms</td>
                                  <td className="py-1.5 px-2">{(c.memory_pressure * 100).toFixed(0)}%</td>
                                  <td className="py-1.5 px-2">{c.has_model_affinity ? 'Yes' : 'No'}</td>
                                  <td className="py-1.5 px-2 text-right text-[#4d6a10]">
                                    {c.final_score.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Disqualified Candidates */}
                  {d.disqualified.length > 0 && (
                    <div className="pt-2">
                      <h5 className="font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        Disqualified Nodes ({d.disqualified.length})
                      </h5>
                      <div className="space-y-1">
                        {d.disqualified.map((dis, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-red-50/60 border border-red-100 text-[11px] text-red-800 flex items-center justify-between"
                          >
                            <span className="font-mono font-bold">
                              {getWorkerIdStr(dis.worker_id)}
                            </span>
                            <span>{dis.reason}</span>
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
    </div>
  );
};

