# MARDUK — Petalyx Frontend Integration Plan

**Date:** 2026-10-31  
**Project:** MARDUK Intelligent GPU Inference Orchestration  
**Status:** Approved for Implementation  
**Auditor / Architect:** Principal Frontend & Motion Systems Engineer  

---

## 1. Audit Findings & Corrective Strategy

Our repository audit revealed concrete discrepancies and architectural issues in the existing codebase that must be corrected during this redesign:

| # | Current Defect | Impact | Corrective Plan in Petalyx Redesign |
|---|---|---|---|
| 1 | `App.tsx` hardcodes fabricated metrics (`1,420,580 tokens`, `142 requests`, `18.4ms latency`). | Misleads operators when the backend is empty or offline. | Replace with genuine live telemetry fetched from `/api/v1/metrics`. If zero or backend offline, display honest `0` or disconnected state. |
| 2 | `api.ts` provides fabricated fallback GPU telemetry (`RTX 3050 A Laptop GPU`, `3.2GB / 4GB`). | Masked API communication errors; simulated hardware that may not exist. | Eliminate mock fallbacks completely. Propagate error states, show "No GPUs Detected" or "Connecting..." state. |
| 3 | `api.ts` provides fabricated fallback worker (`worker-gpu-0`, `mistral-7b-instruct`). | Falsely indicated active workers when supervisor was empty. | Return actual registered workers from `/api/v1/workers`. Show empty state with CTA to spawn workers if list is empty. |
| 4 | `api.ts` provides fabricated fallback scheduling decision (`req-51a11066...`, `cost_score: 35.74`). | Falsely represented scheduler activity. | Fetch genuine recent decisions from `/api/v1/scheduler/decisions`. Show "No requests scheduled yet" if empty. |
| 5 | `fetchHealth()` returns `{ status: 'healthy', uptime_secs: 1840 }` on fetch error. | Claimed healthy status even when server was dead. | Catch failures cleanly: mark health status as `disconnected` or `unreachable`. |
| 6 | `DashboardPreview.tsx` falls back to hardcoded GPU if array is empty. | Prevented honest zero-state rendering. | Implement proper empty-state UI adhering to Petalyx styling. |
| 7 | Inference catch handler outputs fabricated successful AI response. | Pretended inference succeeded when backend failed. | Display real error messages with status code, failure reason, and troubleshooting guidance. Never fabricate completion tokens. |
| 8 | Hero component displays "Backed by: Y Combinator" badge. | Fabricated external affiliation. | Replace with authentic technical badge: `MARDUK // HETEROGENEOUS COMPUTE COORDINATION`. |
| 9 | Feature grid makes unverified "<1.2ms latency overhead" claim. | Arbitrary claim without benchmark reference. | Replace with explainable architecture descriptors backed by reproducible benchmark harnesses. |
| 10 | Redshift/Peakline dark cosmic branding (`#050507`, orange/red glow) conflicts with Petalyx. | Brand inconsistency with primary visual reference. | Completely restyle according to Petalyx design tokens (`--ink`, `--olive`, `--green`, `--lime`, `--pill`, `--line`, `--bg`). |
| 11 | Documentation references `dashboard/` whereas directory is `frontend/`. | Confuses developers following build instructions. | Update all markdown files (`README.md`, `DEVELOPMENT.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`) to point to `frontend/`. |
| 12 | API base URL is hardcoded to `http://127.0.0.1:8080` in `api.ts`. | Fails behind reverse proxies, production deployments, or custom ports. | Introduce `VITE_MARDUK_API_BASE_URL` with fallback to `window.location.origin` / relative `/` in production and `http://127.0.0.1:8080` in dev. |
| 13 | Rust API returns `SystemTelemetry` from `/api/v1/gpus`, but frontend typed it as raw `GpuTelemetry[]`. | Data mapping mismatch causing `gpu.used_memory_bytes` to read `undefined`. | Synchronize TypeScript interfaces with exact Rust structs (`SystemTelemetry`, `GpuMetrics`, `WorkerInfo`, `SchedulingDecision`, `MetricsSnapshot`). |

---

## 2. Design System Architecture (Petalyx Tokens)

The application will be anchored by Petalyx's visual and motion tokens configured across CSS variables and Tailwind extensions:

```css
:root {
  --ink: #121410;
  --olive: #4d6a10;
  --green: #6f9a0c;
  --lime: #b4cd52;
  --pill: #e7efcf;
  --line: #eef0ea;
  --bg: #ffffff;
  --stage: #e9eee0;
  --radius: 22px;
}
```

### Typography
- Primary font: `"Inter Tight"`, system-ui, -apple-system, BlinkMacSystemFont, sans-serif.
- Weights: `400` (Regular), `500` (Medium), `600` (Semi-Bold), `700` (Bold).
- Italic styling applied to keyword emphasis (e.g., *Compute, coordinated.*).

### Motion Architecture
- **GSAP 3.15 + ScrollTrigger:** Choreographed intro sequence, text word reveals with blur transforms, pinning of stats section, scrubbing of ticket counters, parallax translation on hero and night valley background, and footer SVG logo draw animation.
- **Lenis 1.3:** Ultra-smooth inertia scrolling synchronized with GSAP ticker (`gsap.ticker.add(t => lenis.raf(t * 1000))`).
- **CSS Keyframes:** Subtle floating drifts (`driftA`, `driftB`) for pastel clouds; rotating downward particle motion (`@keyframes fall`) for falling cherry blossom petals.
- **Accessibility:** `prefers-reduced-motion` fully respected; disables particle drifts and complex scaling while retaining instant readable transitions.

---

## 3. Component Hierarchy & Page Composition

```
frontend/src/
├── api.ts                         # Strict, honest Rust API client with TypeScript schemas
├── types/
│   └── marduk.ts                  # Mirrored Rust data structures (Telemetry, Workers, Schedulers)
├── hooks/
│   ├── useMardukTelemetry.ts      # Resilient polling hook with stale/offline states
│   └── useLenisScroll.ts          # Smooth scrolling context and anchor jump coordinator
├── components/
│   ├── IntroBackdrop.tsx          # Blurred cherry-blossom backdrop active during intro zoom
│   ├── Navbar.tsx                 # Centered pill nav with brand SVG, links, and Control Center CTA
│   ├── Hero.tsx                   # Petalyx anime-watercolor hero with looping video & frosted glass
│   ├── StatsTicker.tsx            # Pinned section with 4 ticket-cut cards & rising cherry tree
│   ├── ArchitectureAccordion.tsx  # 3-panel interactive accordion with giant numerals & clouds
│   ├── ControlCenter/             # MARDUK Operational Surface (Embedded Petalyx Tabbed Console)
│   │   ├── ClusterOverviewTab.tsx # GPU VRAM bars, thermal telemetry, compute utilization
│   │   ├── WorkerSupervisorTab.tsx# Worker health, queue depths, active models, spawn dialog
│   │   ├── ModelRegistryTab.tsx   # Registered vs loaded models, context windows, quantization
│   │   ├── SchedulerFeedTab.tsx   # Multi-factor routing decisions, candidate evaluations
│   │   ├── BenchmarkSuiteTab.tsx  # Latency distributions, P50/P95/P99, throughput comparison
│   │   └── InferenceConsoleTab.tsx# Real prompt execution against live workers (never fabricated)
│   ├── FallingPetalsCta.tsx       # Moonlit 21:9 valley with 18 falling petals & frosted modal card
│   └── Footer.tsx                 # Animated SVG brand mark, bouncing dots, links, copyright
└── App.tsx                        # Master layout orchestrator, intro timeline, lifecycle cleanup
```

---

## 4. API Integration Specifications

### Endpoint Synchronization

1. **`GET /api/v1/health`**  
   - Response: `{ status: "ok", product: "MARDUK", version: "0.1.0", nvml_available: boolean, active_workers: number }`
   - UI: Pill status badge in Navbar ("Connected • NVML Active" in green or "Degraded • NVML Inactive" in olive).
2. **`GET /api/v1/gpus`**  
   - Response: `SystemTelemetry { hostname, cpu_usage_percent, gpus: GpuMetrics[] }`
   - UI: Ticket cards in stats ticker and detailed hardware meters in Control Center.
3. **`GET /api/v1/workers` & `POST /api/v1/workers` & `DELETE /api/v1/workers/:id`**  
   - Worker lifecycle: inspect active queues, memory usage, spawn new worker processes on device index.
4. **`GET /api/v1/models` & `POST /api/v1/models`**  
   - Catalog of registered models (parameters, context window, quantization) and ready state.
5. **`GET /api/v1/scheduler/decisions`**  
   - Explainable decisions list: `rationale`, `candidates_evaluated`, `disqualified`, `learned_prediction_used`.
6. **`GET /api/v1/metrics`**  
   - `MetricsSnapshot`: `total_requests`, `total_tokens_generated`, `average_latency_ms`, `requests_per_second`.
7. **`POST /v1/chat/completions`**  
   - OpenAI compatible chat completion endpoint. Used by Inference Console. Handles honest errors (503 Service Unavailable when no worker is active, 429 Queue Full when backpressure triggers).

---

## 5. Execution Order

- **Phase 3:** Synchronize API models (`api.ts`), remove mock fallbacks and fake initial states.
- **Phase 4:** Setup typography (`Inter Tight`), CSS variables, Tailwind theme extension, and asset definitions.
- **Phase 5:** Build Petalyx structural components (Intro Backdrop, Pill Nav, Hero with seamless looping video and frosted glass tiles, Pinned Stats ticker with ticket notch masks, 3-panel accordion, and Falling Petals CTA).
- **Phase 6:** Build the Petalyx-adapted MARDUK Control Center with live tabs for Cluster Telemetry, Workers, Models, Scheduler, Benchmarks, and Playground.
- **Phase 7:** Clean up obsolete Redshift/Peakline assets, purge dead imports, update documentation.
- **Phase 8:** Responsive and accessibility testing (keyboard navigation, `prefers-reduced-motion`, mobile viewports down to 360px).
- **Phase 9:** Full TypeScript compilation and production Vite build validation.
- **Phase 10:** Browser verification and final acceptance checklist.

