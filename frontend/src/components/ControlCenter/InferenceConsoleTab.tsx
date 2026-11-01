import React, { useState } from 'react';
import { ModelInfo, WorkerInfo, sendChatCompletion, ChatCompletionResponse } from '../../api';
import { Send, Terminal, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface InferenceConsoleTabProps {
  models: ModelInfo[];
  workers: WorkerInfo[];
}

export const InferenceConsoleTab: React.FC<InferenceConsoleTabProps> = ({
  models,
  workers,
}) => {
  const [prompt, setPrompt] = useState(
    'Explain how continuous batching optimizes VRAM memory bandwidth in distributed GPU clusters.'
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    models[0]?.id || 'mistral-7b-instruct'
  );
  const [maxTokens, setMaxTokens] = useState<number>(64);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<ChatCompletionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeWorkerCount = workers.filter(
    (w) => w.status === 'healthy' || w.status === 'busy'
  ).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await sendChatCompletion(prompt.trim(), selectedModel, maxTokens);
      setResponse(res);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Inference request failed. Please check worker availability.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[#eef0ea]">
        <div>
          <h3 className="text-base font-semibold text-[#121410]">Inference Execution Playground</h3>
          <p className="text-xs text-neutral-500">
            Submit genuine OpenAI-compatible chat completion requests routed through MARDUK's intelligent scheduler.
          </p>
        </div>

        <div className="text-xs">
          {activeWorkerCount === 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              0 Active Workers (Requests may be rejected)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e7efcf] text-[#2c3a10] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#6f9a0c]" />
              {activeWorkerCount} Worker{activeWorkerCount === 1 ? '' : 's'} Ready
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form Column */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-[#121410] block mb-1">
                Target Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-xl border border-[#eef0ea] text-xs bg-white focus:outline-none focus:border-[#4d6a10]"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.default_quantization})
                  </option>
                ))}
                {models.length === 0 && (
                  <option value="mistral-7b-instruct">Mistral 7B Instruct v0.3</option>
                )}
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#121410] block mb-1">
                Max New Tokens
              </label>
              <select
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-xl border border-[#eef0ea] text-xs bg-white focus:outline-none focus:border-[#4d6a10]"
              >
                <option value={32}>32 Tokens</option>
                <option value={64}>64 Tokens</option>
                <option value={128}>128 Tokens</option>
                <option value={256}>256 Tokens</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#121410] text-xs block mb-1">
              Prompt Input
            </label>
            <textarea
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              placeholder="Enter inference prompt..."
              className="w-full p-3.5 rounded-xl border border-[#eef0ea] text-xs font-mono text-[#121410] focus:outline-none focus:border-[#4d6a10] resize-y"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-400 font-mono">
              Endpoint: POST /v1/chat/completions
            </span>

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="btn text-xs h-[36px] px-5"
            >
              <Send className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-pulse' : ''}`} />
              {isLoading ? 'Dispatching...' : 'Submit Inference'}
            </button>
          </div>
        </form>

        {/* Output Console Column */}
        <div className="flex flex-col h-full min-h-[280px] p-4 rounded-2xl bg-[#121410] text-[#eef0ea] font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-800 text-[11px] text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#b4cd52]" />
              Inference Output Terminal
            </span>
            <span>{isLoading ? 'Awaiting tokens...' : 'Idle'}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {isLoading && (
              <div className="flex items-center gap-2 text-neutral-400 py-4 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-[#b4cd52]" />
                <span>Evaluating admission score and dispatching to worker...</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  Inference Error
                </div>
                <div className="text-[11px] leading-relaxed break-words">{error}</div>
                <div className="text-[10px] text-neutral-400 pt-1">
                  Tip: Make sure at least one worker is spawned in the Workers tab.
                </div>
              </div>
            )}

            {response && (
              <div className="space-y-3">
                <div className="text-white text-xs leading-relaxed whitespace-pre-wrap">
                  {response.choices?.[0]?.message?.content || 'No text output.'}
                </div>

                <div className="pt-3 border-t border-neutral-800 text-[10px] text-neutral-400 grid grid-cols-2 gap-2">
                  <div>
                    <span>Prompt Tokens: </span>
                    <strong className="text-neutral-200">{response.usage.prompt_tokens}</strong>
                  </div>
                  <div>
                    <span>Completion Tokens: </span>
                    <strong className="text-[#b4cd52]">{response.usage.completion_tokens}</strong>
                  </div>
                  <div>
                    <span>Total Tokens: </span>
                    <strong className="text-neutral-200">{response.usage.total_tokens}</strong>
                  </div>
                  <div>
                    <span>Finish Reason: </span>
                    <strong className="text-neutral-200">{response.choices?.[0]?.finish_reason || 'stop'}</strong>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && !error && !response && (
              <div className="text-neutral-500 text-xs py-8 text-center italic">
                Ready for inference request. Enter a prompt and submit to view streaming tokens.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
