import React from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { SchedulingDecision, MetricsSnapshot } from '../types';

interface RequestsTabProps {
  decisions: SchedulingDecision[];
  metrics: MetricsSnapshot | null;
}

export const RequestsTab: React.FC<RequestsTabProps> = ({ decisions, metrics }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-cyan-400" />
            Inference Request Dispatch Stream
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audit log of OpenAI-compatible requests, token generation counts, and target worker routing.
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          Total Completed: <span className="text-cyan-400 font-bold">{metrics?.total_requests || 0}</span>
        </div>
      </div>

      {decisions.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-3">
          <Send className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-semibold text-slate-300 text-sm">No Active Request Stream</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Send requests to <code className="text-violet-300 font-mono">POST /v1/chat/completions</code> using any OpenAI SDK or curl to observe real-time scheduling decisions and live execution stream.
          </p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">Assigned Worker</th>
                  <th className="py-3 px-4">Target GPU</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Scheduler Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                {decisions.map((d) => (
                  <tr key={d.decision_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{d.request_id}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(d.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4 text-violet-300 font-semibold">{d.model}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">{d.selected_worker_id}</td>
                    <td className="py-3.5 px-4">GPU [{d.assigned_device_id}]</td>
                    <td className="py-3.5 px-4">
                      <span className="badge badge-healthy text-[10px]">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        Dispatched
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] truncate max-w-xs" title={d.rationale}>
                      {d.rationale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
