# 4. MARDUK Technical Architecture and Repository Migration

## Current repository context

The publicly visible repository README describes a Rust GPU inference orchestration platform with hardware telemetry, worker lifecycle management, model routing, an OpenAI-compatible API and a React dashboard. The README's run instructions point to `dashboard/`, while the root repository listing exposes `frontend/`. The repository currently shows no published GitHub Releases. These facts must be reconciled against the checked-out source before implementation.

The product has pivoted. Do not simply rename the old inference server and call it a benchmark application. Audit each existing crate and retain only functionality that genuinely supports local hardware discovery, local model inference or useful infrastructure diagnostics.

## Recommended top-level architecture

```text
MARDUK repository
├── website/                 Public product website (React/Vite or current site)
├── frontend/                Shared design system / desktop UI if practical
├── crates/
│   ├── marduk-core/         Shared types, config, errors, capability schema
│   ├── marduk-hardware/     CPU, memory, GPU and backend discovery
│   ├── marduk-bench/        Benchmark definitions, orchestration and results
│   ├── marduk-cpu/          CPU compute, SIMD and memory workloads
│   ├── marduk-gpu/          GPU backend abstraction and capability checks
│   ├── marduk-gpu-wgpu/     Portable GPU tests where supported
│   ├── marduk-gpu-cuda/     Optional NVIDIA CUDA-specific tests and telemetry
│   ├── marduk-inference/    Optional local inference adapter
│   ├── marduk-rating/       Transparent scores and reference-set matching
│   ├── marduk-storage/      Local SQLite history and export
│   └── marduk-desktop/      Tauri 2 application shell and IPC commands
├── docs/
└── .github/workflows/      Build, test, package and publish workflows
```

This is a target shape, not a command to create every crate immediately. Consolidate modules where boundaries do not justify independent crates. Inspect the current workspace before choosing names or moving code.

## Website and desktop separation

### Website

- Static or server-rendered content only as required by the current stack.
- Does not run benchmark code.
- Reads published release metadata from a trusted release manifest or GitHub Releases.
- Shows download buttons only when the exact release asset exists and its checksum is available.
- Uses the approved Petalyx-inspired design and existing MARDUK assets/animations. Preserve approved hero details unless the owner explicitly requests a redesign.

### Desktop app

- Tauri 2 shell.
- React/TypeScript frontend reused where useful.
- Rust commands for hardware discovery, benchmark lifecycle, results, settings and local model operations.
- No external service required for local tests.
- Benchmark data stored locally by default.
- Tauri capabilities restricted to required IPC and filesystem paths.

## Backend/module responsibilities

### marduk-core

Defines stable serializable types: DeviceId, DeviceInfo, CpuInfo, GpuInfo, MemoryInfo, BackendCapability, SensorAvailability, BenchmarkConfig, BenchmarkRun, BenchmarkMetric, SafetyEvent and RatingResult. Include schema/version fields for persisted results.

### marduk-hardware

Discovers system CPU, memory, graphics devices and available compute backends. Returns capability records that distinguish supported, unsupported, unavailable and permission-limited fields. Never fabricate values.

### marduk-cpu

Implements bounded CPU compute and memory tests. Uses safe runtime feature detection and architecture-specific code only when supported. Retains a scalar reference path for correctness checks.

### marduk-gpu

Defines common GPU test interfaces, capability negotiation, memory budgets and execution lifecycle. Do not pretend a single adapter exposes all telemetry on all vendors.

### marduk-gpu-wgpu / marduk-gpu-cuda

Implement only verified capabilities. WGPU can provide portable compute tests over available graphics APIs; CUDA-specific tests and NVML telemetry should be an optional NVIDIA path. A test must report its exact backend. Metal, Vulkan or ROCm support must be enabled only after native validation.

### marduk-bench

Owns job states, bounded scheduling, cancellation, concurrency locks, resource admission and result aggregation. Intensive tests run sequentially by default.

### marduk-inference

Optional local model inference adapter. Audit the existing `mistral.rs` implementation and compatibility. Do not automatically start model downloads. Model tests are separate from synthetic compute tests and must record model, quantization, backend and context configuration.

### marduk-rating

Calculates per-domain scores using versioned methodology and validated reference sets. If no suitable reference set exists, expose raw results and mark normalized rating unavailable/provisional.

### marduk-storage

SQLite local persistence, migration, export, data deletion and benchmark history. No automatic upload.

### marduk-desktop

Tauri commands and application lifecycle. Exposes narrow, typed commands rather than arbitrary shell access.

## Technology selection guidance

- Rust: native core and benchmarks.
- Tauri 2: desktop wrapper and secure IPC.
- React + TypeScript: UI reuse.
- SQLite: local history.
- WGPU: candidate portable GPU execution abstraction.
- CUDA/NVML: optional NVIDIA-specialized compute/telemetry path.
- Metal: Apple GPU path where validated; WGPU-on-Metal and native Metal must be labelled accurately.
- Burn: only if MARDUK later needs actual learned models or Burn primitives; not required for basic benchmark kernels.
- CubeCL/CubeK: only for workloads with verified backend support and measured benefit. Do not add a GPU-kernel stack simply as branding.
- mistral.rs/Candle: optional local AI inference backends; inspect existing code and dependency compatibility before selecting.

## Local data flow

```text
Tauri UI
   │ typed IPC
   ▼
Desktop command layer
   │
   ├── Hardware discovery ── CPU / GPU / RAM / capabilities
   │
   ├── Benchmark manager ── preflight / memory budget / job lock
   │       ├── CPU workloads
   │       ├── GPU backend adapter
   │       ├── AI inference adapter (optional)
   │       └── sensor sampler (best effort)
   │
   ├── Rating engine ── versioned formula + compatible reference set
   │
   └── SQLite ── local history / export / deletion
```

## Critical design decisions

1. The website never executes hardware tests.
2. The desktop app does not require a remote backend for benchmarking.
3. CPU benchmark support cannot depend on CUDA, NVML or GPU crates.
4. GPU tests are selected only after runtime capability detection.
5. Missing temperature/power sensors are represented as unavailable.
6. Apple unified memory is not labelled dedicated VRAM.
7. Model inference results are workload-specific and separate from raw hardware scores.
8. Ratings are tied to benchmark version, hardware, backend, precision and configuration.
9. The UI cannot bypass backend safety checks.
10. Existing inference orchestration functionality is retained only if it has a clear role in local AI inference benchmarking or a separate documented product mode.

## Migration strategy

1. Inspect all current crates and frontend pages.
2. Create a feature inventory with implemented, partial, placeholder and broken statuses.
3. Map existing functionality to the new product definition.
4. Preserve working hardware discovery or model inference code that is useful.
5. Remove fabricated fallbacks and misleading success states.
6. Introduce the Tauri desktop shell around the existing UI where practical.
7. Implement CPU benchmark support first because it is platform-independent and provides an end-to-end vertical slice.
8. Add one validated GPU backend at a time.
9. Add benchmark history and rating methodology.
10. Separate and update the public website copy/download flow.
11. Add native CI builds and publish only verified artifacts.
