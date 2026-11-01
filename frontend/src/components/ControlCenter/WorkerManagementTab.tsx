import React, { useState } from 'react';
import {
  WorkerInfo,
  ModelInfo,
  spawnWorker,
  deleteWorker,
  getWorkerIdStr,
} from '../../api';
import { Plus, Trash2, Cpu, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

interface WorkerManagementTabProps {
  workers: WorkerInfo[];
  models: ModelInfo[];
  onRefresh: () => void;
}

export const WorkerManagementTab: React.FC<WorkerManagementTabProps> = ({
  workers,
  models,
  onRefresh,
}) => {
  const [showSpawnModal, setShowSpawnModal] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [deviceId, setDeviceId] = useState(0);
  const [selectedModel, setSelectedModel] = useState<string>(
    models[0]?.id || 'mistral-7b-instruct'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSpawn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    const generatedId = `worker-${Date.now().toString(36)}`;
    const name = workerName.trim() || `Local Worker (${selectedModel})`;

    try {
      await spawnWorker({
        id: generatedId,
        name,
        device_id: deviceId,
        model: selectedModel,
        supported_models: models.map((m) => m.id),
      });
      setShowSpawnModal(false);
      setWorkerName('');
      onRefresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to spawn worker');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (rawId: string | { 0: string }) => {
    const id = getWorkerIdStr(rawId);
    if (!confirm(`Are you sure you want to terminate worker [${id}]?`)) return;

    try {
      await deleteWorker(id);
      onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to terminate worker');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e7efcf] text-[#2c3a10]">
            <CheckCircle2 className="w-3 h-3 text-[#6f9a0c]" />
            Healthy
          </span>
        );
      case 'busy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800">
            <Activity className="w-3 h-3 text-amber-600 animate-pulse" />
            Busy
          </span>
        );
      case 'starting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700">
            Starting
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eef0ea]">
        <div>
          <h3 className="text-base font-semibold text-[#121410]">Worker Supervisor Fleet</h3>
          <p className="text-xs text-neutral-500">
            Isolated runtime worker processes mapped to physical GPU devices.
          </p>
        </div>

        <button
          onClick={() => setShowSpawnModal(true)}
          className="btn text-xs h-[34px] px-4 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Spawn Local Worker
        </button>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Workers Table / Cards */}
      {workers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-neutral-300">
          <Cpu className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-[#121410]">No Active Workers Registered</h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            The worker supervisor has no running processes. Spawn an inference worker to process requests through the scheduler.
          </p>
          <button
            onClick={() => setShowSpawnModal(true)}
            className="btn mt-4 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Spawn First Worker
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workers.map((w) => {
            const idStr = getWorkerIdStr(w.id);

            return (
              <div
                key={idStr}
                className="p-5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm hover:border-[#b4cd52] transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#121410]">{w.name}</span>
                      {getStatusBadge(w.status)}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                      ID: {idStr}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(w.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer"
                    title="Terminate Worker"
                    aria-label={`Terminate worker ${idStr}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-2 border-t border-[#f4f6f0]">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block">GPU Device</span>
                    <span className="font-semibold text-[#121410]">GPU {w.assigned_device_id}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block">Loaded Model</span>
                    <span className="font-semibold text-[#4d6a10] truncate block">
                      {w.loaded_model || 'None (Idle)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block">Queue Depth</span>
                    <span className="font-semibold text-[#121410]">
                      {w.current_queue_depth} / {w.max_queue_capacity}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block">Active Reqs</span>
                    <span className="font-semibold text-[#121410]">{w.active_requests}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block">Processed Reqs</span>
                    <span className="font-semibold text-[#121410]">
                      {w.total_requests_processed.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block">Avg Latency</span>
                    <span className="font-semibold text-[#121410]">
                      {w.average_latency_ms ? `${w.average_latency_ms.toFixed(1)}ms` : '0ms'}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1">
                  <span>Started: {new Date(w.started_at).toLocaleTimeString()}</span>
                  <span>Heartbeat: {new Date(w.last_heartbeat).toLocaleTimeString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Spawn Worker Modal */}
      {showSpawnModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowSpawnModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-neutral-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-bold text-[#121410]">Spawn Local Inference Worker</h4>
            <p className="text-xs text-neutral-500">
              Spawns an isolated worker runtime managed by MARDUK's supervisor.
            </p>

            <form onSubmit={handleSpawn} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#121410] block mb-1">
                  Worker Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Worker Alpha (Mistral 7B)"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#eef0ea] text-xs focus:outline-none focus:border-[#4d6a10]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#121410] block mb-1">
                  Target GPU Device
                </label>
                <select
                  value={deviceId}
                  onChange={(e) => setDeviceId(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#eef0ea] text-xs bg-white focus:outline-none focus:border-[#4d6a10]"
                >
                  <option value={0}>GPU 0 (Primary Accelerator)</option>
                  <option value={1}>GPU 1</option>
                  <option value={2}>GPU 2</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#121410] block mb-1">
                  Initial Model Weight
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#eef0ea] text-xs bg-white focus:outline-none focus:border-[#4d6a10]"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.default_quantization}) - {m.parameter_count_billions}B
                    </option>
                  ))}
                  {models.length === 0 && (
                    <option value="mistral-7b-instruct">Mistral 7B Instruct v0.3</option>
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#eef0ea]">
                <button
                  type="button"
                  onClick={() => setShowSpawnModal(false)}
                  className="btn-secondary text-xs h-[34px] px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn text-xs h-[34px] px-5"
                >
                  {isSubmitting ? 'Spawning...' : 'Spawn Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

