import React, { useState, useEffect } from 'react';
import { BenchmarkResult, fetchBenchmarks, runBenchmark } from '../../api';
import { Play, TrendingUp, Clock, ShieldCheck, AlertCircle, Zap } from 'lucide-react';
import { BenchmarkModal } from '../BenchmarkModal';

export const BenchmarkTab: React.FC = () => {
  const [historyCount, setHistoryCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [concurrency, setConcurrency] = useState(4);
  const [totalRequests, setTotalRequests] = useState(40);
  const [latestComparison, setLatestComparison] = useState<{
    multifactor: BenchmarkResult;
    baseline: BenchmarkResult;
  } | null>(null);

  const loadHistory = async () => {
    try {
      const data = await fetchBenchmarks();
      setHistoryCount(data.length);
      if (data.length >= 2) {
        setLatestComparison({
          multifactor: data[data.length - 2],
          baseline: data[data.length - 1],
        });
      }
    } catch (err) {
      console.warn('Failed to fetch benchmark history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await runBenchmark({
        concurrency,
        total_requests: totalRequests,
        model: 'mistral-7b-instruct',
        max_tokens: 32,
      });
      setLatestComparison({
        multifactor: res.multifactor,
        baseline: res.baseline,
      });
      await loadHistory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Benchmark execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 5-Module Hardware Benchmark Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#f8faf4] to-[#edf4e4] border border-[#d8e4c6] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase bg-[#e7efcf] text-[#4d6a10] px-2.5 py-0.5 rounded-full">
            HARDWARE SUITE & RATING
          </span>
          <h4 className="text-sm font-semibold text-[#121410] mt-1 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#6f9a0c]" />
            <span>GPU & CPU Hardware Benchmark Modules</span>
          </h4>
          <p className="text-xs text-neutral-600 mt-0.5">
            Execute genuine FP32 GEMM, VRAM bandwidth, Tensor Core acceleration, AI inference tokens, and thermal stress tests.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn h-9 px-4 text-xs font-semibold whitespace-nowrap shadow-sm"
        >
          Launch Hardware Suite
        </button>
      </div>

      <BenchmarkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialType="compute_core"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eef0ea]">
        <div>
          <h3 className="text-base font-semibold text-[#121410]">Performance Benchmark Suite</h3>
          <p className="text-xs text-neutral-500">
            Reproducible comparison between MARDUK Deterministic Multi-Factor and Round-Robin baseline scheduling ({historyCount} runs in memory).
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2 text-xs">
            <label className="text-neutral-500 font-medium">Concurrency:</label>
            <select
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              disabled={isRunning}
              className="px-2.5 py-1 rounded-lg border border-[#eef0ea] text-xs bg-white focus:outline-none"
            >
              <option value={2}>2 Threads</option>
              <option value={4}>4 Threads</option>
              <option value={8}>8 Threads</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="text-neutral-500 font-medium">Reqs:</label>
            <select
              value={totalRequests}
              onChange={(e) => setTotalRequests(Number(e.target.value))}
              disabled={isRunning}
              className="px-2.5 py-1 rounded-lg border border-[#eef0ea] text-xs bg-white focus:outline-none"
            >
              <option value={20}>20 Requests</option>
              <option value={40}>40 Requests</option>
              <option value={80}>80 Requests</option>
            </select>
          </div>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="btn text-xs h-[34px] px-4"
          >
            <Play className={`w-3.5 h-3.5 mr-1 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Benchmarking...' : 'Execute Run'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Latest Comparison View */}
      {latestComparison ? (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Latest Benchmark Head-to-Head Comparison
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deterministic Multi-Factor Card */}
            <div className="p-5 rounded-2xl bg-[#f8faf5] border border-[#a2bf3c]/50 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#4d6a10] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#6f9a0c]" />
                  {latestComparison.multifactor.policy_name}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e7efcf] text-[#2c3a10]">
                  Active Scheduler
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-[#eef0ea]">
                  <span className="text-[10px] text-neutral-400 uppercase block">Throughput (RPS)</span>
                  <span className="text-lg font-bold text-[#121410] font-mono">
                    {latestComparison.multifactor.requests_per_second.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-neutral-400 block">reqs/sec</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#eef0ea]">
                  <span className="text-[10px] text-neutral-400 uppercase block">Generation (TPS)</span>
                  <span className="text-lg font-bold text-[#6f9a0c] font-mono">
                    {latestComparison.multifactor.tokens_per_second.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-neutral-400 block">tok/sec</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#eef0ea] space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-neutral-600">
                  <span>P50 Latency:</span>
                  <strong className="text-[#121410]">
                    {latestComparison.multifactor.latency.p50_ms.toFixed(1)}ms
                  </strong>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>P95 Latency:</span>
                  <strong className="text-[#121410]">
                    {latestComparison.multifactor.latency.p95_ms.toFixed(1)}ms
                  </strong>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>P99 Latency:</span>
                  <strong className="text-[#121410]">
                    {latestComparison.multifactor.latency.p99_ms.toFixed(1)}ms
                  </strong>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Scheduling Overhead:</span>
                  <strong className="text-[#4d6a10]">
                    {latestComparison.multifactor.scheduling_overhead_avg_us.toFixed(1)} µs
                  </strong>
                </div>
              </div>
            </div>

            {/* Round-Robin Baseline Card */}
            <div className="p-5 rounded-2xl bg-white border border-[#eef0ea] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-neutral-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  {latestComparison.baseline.policy_name}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                  Baseline Policy
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <span className="text-[10px] text-neutral-400 uppercase block">Throughput (RPS)</span>
                  <span className="text-lg font-bold text-[#121410] font-mono">
                    {latestComparison.baseline.requests_per_second.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-neutral-400 block">reqs/sec</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <span className="text-[10px] text-neutral-400 uppercase block">Generation (TPS)</span>
                  <span className="text-lg font-bold text-neutral-700 font-mono">
                    {latestComparison.baseline.tokens_per_second.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-neutral-400 block">tok/sec</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#eef0ea] space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-neutral-600">
                  <span>P50 Latency:</span>
                  <strong className="text-[#121410]">
                    {latestComparison.baseline.latency.p50_ms.toFixed(1)}ms
                  </strong>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>P95 Latency:</span>
                  <strong className="text-[#121410]">
                    {latestComparison.baseline.latency.p95_ms.toFixed(1)}ms
                  </strong>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>P99 Latency:</span>
                  <strong className="text-[#121410]">
                    {latestComparison.baseline.latency.p99_ms.toFixed(1)}ms
                  </strong>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Scheduling Overhead:</span>
                  <strong className="text-neutral-600">
                    {latestComparison.baseline.scheduling_overhead_avg_us.toFixed(1)} µs
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-neutral-300">
          <TrendingUp className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-[#121410]">No Benchmark Executed Yet</h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Click "Execute Run" above to run an automated, reproducible comparison between scheduling modes.
          </p>
        </div>
      )}
    </div>
  );
};
