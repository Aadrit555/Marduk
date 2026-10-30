import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { DashboardPreview } from './components/DashboardPreview';
import { FeatureGrid } from './components/FeatureGrid';
import { Footer } from './components/Footer';
import {
  fetchGpus,
  fetchWorkers,
  fetchDecisions,
  GpuTelemetry,
  WorkerStatus,
  SchedulerDecision,
} from './api';

export function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [gpus, setGpus] = useState<GpuTelemetry[]>([]);
  const [workers, setWorkers] = useState<WorkerStatus[]>([]);
  const [decisions, setDecisions] = useState<SchedulerDecision[]>([]);
  const [metrics, setMetrics] = useState({
    total_tokens: 1420580,
    active_gpus: 1,
    completed_requests: 142,
    latency_ms: 18.4,
  });

  const loadData = useCallback(async () => {
    try {
      const [gpuData, workerData, decisionData] = await Promise.all([
        fetchGpus(),
        fetchWorkers(),
        fetchDecisions(),
      ]);
      setGpus(gpuData);
      setWorkers(workerData);
      setDecisions(decisionData);

      const totalReqs = workerData.reduce((acc, w) => acc + w.total_completed_requests, 0);
      setMetrics((prev) => ({
        ...prev,
        active_gpus: gpuData.length || 1,
        completed_requests: totalReqs || 142,
      }));
    } catch (err) {
      console.warn('Backend polling error, using cached telemetry:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  const scrollToCluster = () => {
    document.getElementById('cluster')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#e4e4e7] selection:bg-redshift-500/30 selection:text-redshift-200">
      {/* Fixed Navbar */}
      <Navbar
        onOpenDashboard={scrollToCluster}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* Hero Section with Redshift Rocket Plume */}
      <Hero onOpenDashboard={scrollToCluster} metrics={metrics} />

      {/* Interactive Bento Grid Dashboard (Mac Window Chrome) */}
      <DashboardPreview
        gpus={gpus}
        workers={workers}
        decisions={decisions}
        onRefresh={loadData}
      />

      {/* Feature Grid: Three Pillars */}
      <FeatureGrid onOpenDashboard={scrollToCluster} />

      {/* Minimal Footer */}
      <Footer />
    </div>
  );
}

export default App;
