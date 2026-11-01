import React, { useState } from 'react';
import {
  SystemTelemetry,
  WorkerInfo,
  ModelInfo,
  SchedulingDecision,
  MetricsSnapshot,
  HealthStatus,
} from '../../api';
import { ClusterOverviewTab } from './ClusterOverviewTab';
import { WorkerManagementTab } from './WorkerManagementTab';
import { ModelRegistryTab } from './ModelRegistryTab';
import { SchedulerFeedTab } from './SchedulerFeedTab';
import { BenchmarkTab } from './BenchmarkTab';
import { InferenceConsoleTab } from './InferenceConsoleTab';
import {
  Cpu,
  Users,
  Database,
  GitBranch,
  TrendingUp,
  Terminal,
  RefreshCw,
} from 'lucide-react';

interface ControlCenterProps {
  telemetry: SystemTelemetry | null;
  workers: WorkerInfo[];
  models: ModelInfo[];
  decisions: SchedulingDecision[];
  metrics: MetricsSnapshot | null;
  health: HealthStatus | null;
  isLoading: boolean;
  onRefresh: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const ControlCenter: React.FC<ControlCenterProps> = ({
  telemetry,
  workers,
  models,
  decisions,
  metrics,
  health,
  isLoading,
  onRefresh,
  activeTab: externalTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<string>('hardware');
  const activeTab = externalTab || internalTab;

  const setActiveTab = (tab: string) => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  const tabs = [
    { id: 'hardware', label: 'Hardware Telemetry', icon: Cpu },
    { id: 'workers', label: 'Worker Supervisor', icon: Users, badge: workers.length },
    { id: 'models', label: 'Model Catalog', icon: Database, badge: models.length },
    { id: 'scheduler', label: 'Scheduler Decisions', icon: GitBranch, badge: decisions.length },
    { id: 'benchmarks', label: 'Benchmarks', icon: TrendingUp },
    { id: 'inference', label: 'Inference Playground', icon: Terminal },
  ];

  return (
    <section id="control-center" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e7efcf] text-[#2c3a10] text-[11px] font-medium tracking-wide mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4d6a10]" />
            MARDUK OPERATIONAL SURFACE
          </div>
          <h2 className="text-2xl sm:text-4xl font-normal tracking-tight text-[#121410]">
            Autonomous Cluster Control Center
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-xl">
            Unified control plane for hardware telemetry, runtime worker management, predictive request routing, and reproducible benchmarks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {health && (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#e7efcf] text-[#2c3a10]">
              v{health.version} • {health.active_workers} workers
            </span>
          )}
          {metrics && (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-600">
              {metrics.total_requests.toLocaleString()} reqs • {metrics.total_tokens_generated.toLocaleString()} tokens
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="btn-secondary text-xs h-[36px] px-3.5 flex items-center gap-1.5"
            aria-label="Refresh telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Polling...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Main Elevated Card */}
      <div className="rounded-[22px] bg-white border border-[#eef0ea] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Navigation Tab Bar */}
        <div className="flex items-center gap-1 p-2 bg-[#f8faf5] border-b border-[#eef0ea] overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border-none cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#121410] shadow-sm border border-[#eef0ea]'
                    : 'text-neutral-500 hover:text-[#121410] hover:bg-white/60 bg-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#4d6a10]' : 'text-neutral-400'
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-[#e7efcf] text-[#2c3a10]'
                        : 'bg-neutral-200/60 text-neutral-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 sm:p-8 bg-white min-h-[460px]">
          {activeTab === 'hardware' && (
            <ClusterOverviewTab
              telemetry={telemetry}
              onRefresh={onRefresh}
            />
          )}

          {activeTab === 'workers' && (
            <WorkerManagementTab
              workers={workers}
              models={models}
              onRefresh={onRefresh}
            />
          )}

          {activeTab === 'models' && (
            <ModelRegistryTab
              models={models}
              workers={workers}
              onRefresh={onRefresh}
            />
          )}

          {activeTab === 'scheduler' && (
            <SchedulerFeedTab decisions={decisions} />
          )}

          {activeTab === 'benchmarks' && <BenchmarkTab />}

          {activeTab === 'inference' && (
            <InferenceConsoleTab models={models} workers={workers} />
          )}
        </div>
      </div>
    </section>
  );
};
