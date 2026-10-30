import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { GpuMonitoringTab } from './components/GpuMonitoringTab';
import { WorkerManagementTab } from './components/WorkerManagementTab';
import { ModelManagementTab } from './components/ModelManagementTab';
import { SchedulerTab } from './components/SchedulerTab';
import { PerformanceTab } from './components/PerformanceTab';
import { DiagnosticsTab } from './components/DiagnosticsTab';
import {
  HealthResponse,
  SystemTelemetry,
  WorkerInfo,
  ModelInfo,
  SchedulingDecision,
  MetricsSnapshot,
} from './types';
import {
  fetchHealth,
  fetchSystemTelemetry,
  fetchWorkers,
  fetchModels,
  fetchSchedulerDecisions,
  fetchMetrics,
} from './api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [workers, setWorkers] = useState<WorkerInfo[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [decisions, setDecisions] = useState<SchedulingDecision[]>([]);
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [h, t, w, m, d, met] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchSystemTelemetry().catch(() => null),
        fetchWorkers().catch(() => []),
        fetchModels().catch(() => []),
        fetchSchedulerDecisions().catch(() => []),
        fetchMetrics().catch(() => null),
      ]);

      if (h) setHealth(h);
      if (t) setTelemetry(t);
      setWorkers(w);
      setModels(m);
      setDecisions(d);
      if (met) setMetrics(met);
    } catch (e) {
      console.error('Error fetching MARDUK telemetry:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic polling interval: 1.5 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData();
    }, 1500);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  return (
    <div className="dashboard-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* Controls bar */}
        <div className="flex items-center justify-between pb-4">
          <div className="text-xs text-slate-400">
            Connected to <span className="text-white font-mono">http://127.0.0.1:8080</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-0"
              />
              Live Polling (1.5s)
            </label>
          </div>
        </div>

        {/* Tab Switcher Content */}
        {activeTab === 'overview' && (
          <OverviewTab
            telemetry={telemetry}
            workers={workers}
            models={models}
            metrics={metrics}
            decisions={decisions}
          />
        )}
        {activeTab === 'gpus' && <GpuMonitoringTab telemetry={telemetry} />}
        {activeTab === 'workers' && <WorkerManagementTab workers={workers} onRefresh={loadData} />}
        {activeTab === 'models' && <ModelManagementTab models={models} workers={workers} />}
        {activeTab === 'scheduler' && <SchedulerTab decisions={decisions} />}
        {activeTab === 'performance' && <PerformanceTab metrics={metrics} />}
        {activeTab === 'diagnostics' && <DiagnosticsTab telemetry={telemetry} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-400 font-mono">
        MARDUK Platform • Intelligent GPU Inference Orchestrator • Zero Synthetic Metrics
      </footer>
    </div>
  );
};
