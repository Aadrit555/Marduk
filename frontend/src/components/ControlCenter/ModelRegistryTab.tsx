import React, { useState } from 'react';
import { ModelInfo, WorkerInfo, registerModel } from '../../api';
import { Plus, Database, CheckCircle2 } from 'lucide-react';

interface ModelRegistryTabProps {
  models: ModelInfo[];
  workers: WorkerInfo[];
  onRefresh: () => void;
}

export const ModelRegistryTab: React.FC<ModelRegistryTabProps> = ({
  models,
  workers,
  onRefresh,
}) => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [modelId, setModelId] = useState('');
  const [name, setName] = useState('');
  const [family, setFamily] = useState('mistral');
  const [params, setParams] = useState(7.0);
  const [contextWindow, setContextWindow] = useState(8192);
  const [quant, setQuant] = useState('Q4_K_M');
  const [vramMb, setVramMb] = useState(4500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set of model IDs currently loaded on active workers
  const loadedModelIds = new Set(
    workers
      .map((w) => w.loaded_model)
      .filter((m): m is string => Boolean(m))
  );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelId.trim() || !name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await registerModel({
        id: modelId.trim().toLowerCase(),
        name: name.trim(),
        family,
        parameter_count_billions: Number(params),
        context_window: Number(contextWindow),
        default_quantization: quant,
        estimated_vram_mb: Number(vramMb),
        created_at: new Date().toISOString(),
      });
      setShowRegisterModal(false);
      setModelId('');
      setName('');
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register model');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eef0ea]">
        <div>
          <h3 className="text-base font-semibold text-[#121410]">Model Catalog & Registry</h3>
          <p className="text-xs text-neutral-500">
            Registered LLM weights, quantization formats, and context capacities available for scheduler allocation.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="btn text-xs h-[34px] px-4 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Register Model
        </button>
      </div>

      {models.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-neutral-300">
          <Database className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-[#121410]">No Models in Registry</h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            No models have been registered into MARDUK's memory registry.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {models.map((m) => {
            const isLoaded = loadedModelIds.has(m.id);

            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm hover:border-[#b4cd52] transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#e7efcf] text-[#2c3a10]">
                      {m.family}
                    </span>
                    {isLoaded ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#4d6a10]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6f9a0c]" />
                        Active on Worker
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-400">Registered</span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-[#121410]">{m.name}</h4>
                  <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                    ID: {m.id}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-[#f4f6f0]">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block">Parameters</span>
                    <span className="font-semibold text-[#121410]">{m.parameter_count_billions}B</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block">Context Window</span>
                    <span className="font-semibold text-[#121410]">
                      {(m.context_window / 1024).toFixed(0)}k tokens
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block">Quantization</span>
                    <span className="font-semibold text-[#121410]">{m.default_quantization}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block">Est. VRAM</span>
                    <span className="font-semibold text-[#121410]">{m.estimated_vram_mb} MB</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Register Model Modal */}
      {showRegisterModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowRegisterModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-neutral-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-bold text-[#121410]">Register New Model</h4>
            <p className="text-xs text-neutral-500">
              Add a model profile to MARDUK's registry for admission and scheduling.
            </p>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">{error}</div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-[#121410] block mb-1">Model Identifier (ID)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. deepseek-coder-6.7b"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#eef0ea] text-xs focus:outline-none focus:border-[#4d6a10]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#121410] block mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DeepSeek Coder 6.7B Instruct"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#eef0ea] text-xs focus:outline-none focus:border-[#4d6a10]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#121410] block mb-1">Architecture Family</label>
                  <input
                    type="text"
                    value={family}
                    onChange={(e) => setFamily(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#eef0ea] text-xs focus:outline-none focus:border-[#4d6a10]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#121410] block mb-1">Parameter Count (B)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={params}
                    onChange={(e) => setParams(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#eef0ea] text-xs focus:outline-none focus:border-[#4d6a10]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#121410] block mb-1">Context Window</label>
                  <input
                    type="number"
                    step="512"
                    value={contextWindow}
                    onChange={(e) => setContextWindow(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#eef0ea] text-xs focus:outline-none focus:border-[#4d6a10]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#121410] block mb-1">Quantization Format</label>
                  <input
                    type="text"
                    value={quant}
                    onChange={(e) => setQuant(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#eef0ea] text-xs focus:outline-none focus:border-[#4d6a10]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-[#121410] block mb-1">Estimated VRAM (MB)</label>
                  <input
                    type="number"
                    step="100"
                    value={vramMb}
                    onChange={(e) => setVramMb(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#eef0ea] text-xs focus:outline-none focus:border-[#4d6a10]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#eef0ea]">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="btn-secondary text-xs h-[34px] px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn text-xs h-[34px] px-5"
                >
                  {isSubmitting ? 'Registering...' : 'Register Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
