import React, { useState } from 'react';
import { Server, Plus, Trash2, Cpu, Layers, Zap } from 'lucide-react';
import { WorkerInfo } from '../types';
import { spawnWorker, deleteWorker } from '../api';

interface WorkerManagementTabProps {
  workers: WorkerInfo[];
  onRefresh: () => void;
}

export const WorkerManagementTab: React.FC<WorkerManagementTabProps> = ({ workers, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newDeviceId, setNewDeviceId] = useState(0);
  const [newModel, setNewModel] = useState('mistral-7b-instruct');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSpawn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newName) return;
    setIsSubmitting(true);
    try {
      await spawnWorker({
        id: newId,
        name: newName,
        device_id: Number(newDeviceId),
        model: newModel || undefined,
        supported_models: [newModel, 'llama-3-8b', 'qwen-2.5-coder-7b'],
      });
      setShowModal(false);
      setNewId('');
      setNewName('');
      onRefresh();
    } catch (err) {
      alert(`Error spawning worker: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to stop and unregister worker '${id}'?`)) return;
    try {
      await deleteWorker(id);
      onRefresh();
    } catch (err) {
      alert(`Error stopping worker: ${err}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            Inference Worker Fleet Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage worker lifecycles, inspect bounded queues, and assign GPU affinity.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Spawn Inference Worker
        </button>
      </div>

      {workers.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-3">
          <Server className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-semibold text-slate-300 text-sm">No Active Workers Registered</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Spawn a worker instance to begin serving inference workloads across available GPUs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {workers.map((w) => {
            const queueRatio = w.max_queue_capacity > 0 ? (w.current_queue_depth / w.max_queue_capacity) * 100 : 0;
            const isHealthy = w.status === 'healthy';

            return (
              <div key={w.id} className="glass-panel p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">{w.name}</h3>
                      <span className="font-mono text-xs text-slate-400">({w.id})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Cpu className="w-3.5 h-3.5 text-violet-400" />
                        GPU Device {w.assigned_device_id}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        {w.loaded_model || 'No model resident'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`badge ${isHealthy ? 'badge-healthy' : 'badge-degraded'}`}>
                      {w.status}
                    </span>
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all border border-rose-500/20"
                      title="Graceful Shutdown"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Queue depth progress */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Queue Depth & Backpressure
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {w.current_queue_depth} / {w.max_queue_capacity} requests
                    </span>
                  </div>

                  <div className="progress-bar-bg">
                    <div
                      className={`progress-bar-fill ${
                        queueRatio > 80 ? 'bg-rose-500' : queueRatio > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(queueRatio, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Performance stats */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="p-2 rounded bg-slate-900/40 border border-slate-800/80">
                    <span className="text-slate-400">Processed</span>
                    <div className="font-bold text-slate-200 mt-0.5">{w.total_requests_processed.toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/40 border border-slate-800/80">
                    <span className="text-slate-400">Tokens</span>
                    <div className="font-bold text-slate-200 mt-0.5">{w.total_tokens_generated.toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/40 border border-slate-800/80">
                    <span className="text-slate-400">Avg Latency</span>
                    <div className="font-bold text-slate-200 mt-0.5">{w.average_latency_ms.toFixed(1)} ms</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Spawn Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 max-w-md w-full border-slate-700 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-violet-400" />
              Spawn New Inference Worker
            </h3>

            <form onSubmit={handleSpawn} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Worker Identifier (ID)</label>
                <input
                  type="text"
                  required
                  placeholder="worker-gpu-1"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="Secondary Ampere Worker"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assigned GPU Device Index</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Preloaded Model</label>
                <select
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-violet-500 focus:outline-none"
                >
                  <option value="mistral-7b-instruct">Mistral 7B Instruct v0.3</option>
                  <option value="llama-3-8b">Meta Llama 3 8B</option>
                  <option value="qwen-2.5-coder-7b">Qwen 2.5 Coder 7B</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? 'Spawning...' : 'Deploy Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
