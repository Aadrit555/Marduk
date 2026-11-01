import { useState, useEffect, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import {
  fetchHealth,
  fetchGpus,
  fetchWorkers,
  fetchDecisions,
  fetchMetrics,
  fetchModels,
  SystemTelemetry,
  WorkerInfo,
  ModelInfo,
  SchedulingDecision,
  MetricsSnapshot,
  HealthStatus,
} from './api';

import { IntroBackdrop } from './components/IntroBackdrop';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { StatsTicker } from './components/StatsTicker';
import { ArchitectureAccordion } from './components/ArchitectureAccordion';
import { PlatformSection } from './components/PlatformSection';
import { HowItWorks } from './components/HowItWorks';
import { SafetySection } from './components/SafetySection';
import { ControlCenter } from './components/ControlCenter/ControlCenter';
import { FallingPetalsCta } from './components/FallingPetalsCta';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';

gsap.registerPlugin(ScrollTrigger);

export function App() {
  const [introActive, setIntroActive] = useState<boolean>(true);
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [workers, setWorkers] = useState<WorkerInfo[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [decisions, setDecisions] = useState<SchedulingDecision[]>([]);
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [controlCenterTab, setControlCenterTab] = useState<string>('hardware');

  const appRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isReduced) {
      const lenis = new Lenis({
        duration: 1.25,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      lenis.on('scroll', ScrollTrigger.update);
      const rafCallback = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(rafCallback);
      gsap.ticker.lagSmoothing(0);

      lenisRef.current = lenis;

      return () => {
        gsap.ticker.remove(rafCallback);
        lenis.destroy();
      };
    }
  }, []);

  // Petalyx Intro Zoom Sequence
  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) {
      setIntroActive(false);
      return;
    }

    if (lenisRef.current) {
      lenisRef.current.stop();
    }

    if (appRef.current) {
      gsap.fromTo(
        appRef.current,
        { scale: 0.9, borderRadius: '28px' },
        {
          scale: 1.0,
          borderRadius: '0px',
          duration: 1.4,
          ease: 'expo.inOut',
          delay: 0.25,
          onComplete: () => {
            setIntroActive(false);
            if (appRef.current) {
              gsap.set(appRef.current, { clearProps: 'all' });
            }
            if (lenisRef.current) {
              lenisRef.current.start();
            }
            ScrollTrigger.refresh();
          },
        }
      );
    }
  }, []);

  // Poll genuine backend telemetry
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [healthRes, gpuRes, workerRes, modelRes, decisionRes, metricRes] =
        await Promise.allSettled([
          fetchHealth(),
          fetchGpus(),
          fetchWorkers(),
          fetchModels(),
          fetchDecisions(),
          fetchMetrics(),
        ]);

      if (healthRes.status === 'fulfilled') {
        setHealth(healthRes.value);
        setConnectionState('connected');
      } else {
        setConnectionState('disconnected');
      }

      if (gpuRes.status === 'fulfilled') setTelemetry(gpuRes.value);
      if (workerRes.status === 'fulfilled') setWorkers(workerRes.value);
      if (modelRes.status === 'fulfilled') setModels(modelRes.value);
      if (decisionRes.status === 'fulfilled') setDecisions(decisionRes.value);
      if (metricRes.status === 'fulfilled') setMetrics(metricRes.value);
    } catch (err) {
      console.warn('Backend polling error:', err);
      setConnectionState('disconnected');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleOpenControlCenter = (tab?: string) => {
    if (tab) setControlCenterTab(tab);
    const target = document.getElementById('control-center');
    if (target) {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target, { offset: -40, duration: 1.4 });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleExplorePlatform = () => {
    const target = document.getElementById('stats');
    if (target) {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target, { duration: 1.4 });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      {/* Intro Blurred Backdrop */}
      <IntroBackdrop visible={introActive} />

      {/* Main Petalyx Application Canvas */}
      <div
        id="app"
        ref={appRef}
        className="relative z-10 bg-white overflow-clip min-h-screen text-[#121410]"
        style={{
          transformOrigin: '50% 50vh',
        }}
      >
        {/* Floating Pill Navigation */}
        <Navbar
          health={health}
          connectionState={connectionState}
          onOpenControlCenter={handleOpenControlCenter}
        />

        {/* Hero Section with Restored Floating Glass Panels */}
        <Hero
          onOpenControlCenter={() => handleOpenControlCenter('benchmarks')}
          onExplorePlatform={handleExplorePlatform}
        />

        {/* Intro Section: One toolkit. Your whole system. */}
        <StatsTicker
          telemetry={telemetry}
          workers={workers}
          metrics={metrics}
        />

        {/* 5 Core Benchmark Features Accordion */}
        <ArchitectureAccordion onOpenControlCenter={handleOpenControlCenter} />

        {/* Platform Support Section */}
        <PlatformSection />

        {/* How It Works: Detect -> Choose -> Measure -> Understand */}
        <HowItWorks />

        {/* Safety & Privacy Section */}
        <SafetySection />

        {/* Moonlit 21:9 CTA with Falling Petals & Download Selector */}
        <FallingPetalsCta
          onOpenControlCenter={() => handleOpenControlCenter('benchmarks')}
        />

        {/* FAQ Section */}
        <FaqSection />

        {/* Operational Benchmark & Hardware Console */}
        <ControlCenter
          telemetry={telemetry}
          workers={workers}
          models={models}
          decisions={decisions}
          metrics={metrics}
          health={health}
          isLoading={isLoading}
          onRefresh={loadData}
          activeTab={controlCenterTab}
          onTabChange={setControlCenterTab}
        />

        {/* Lime Footer with Animated SVG Mark */}
        <Footer onOpenControlCenter={handleOpenControlCenter} />
      </div>
    </>
  );
}

export default App;
