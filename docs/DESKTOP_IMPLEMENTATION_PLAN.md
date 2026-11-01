# MARDUK Desktop — Implementation Plan

## 1. Master Strategy & Phase Overview

This plan defines the step-by-step engineering roadmap to transform MARDUK into a native, cross-platform hardware benchmarking desktop application while preserving the approved Petalyx visual identity.

```
+------------------------------------------------------------------------------------------+
| PHASE 0: AUDIT & ARCHITECTURE SPECIFICATION                                     [DONE]   |
+------------------------------------------------------------------------------------------+
                                           |
                                           v
+------------------------------------------------------------------------------------------+
| PHASE 1: TAURI 2 DESKTOP SHELL FOUNDATION & WORKSPACE SETUP                              |
| - Initialize `src-tauri` workspace configuration                                         |
| - Tauri 2 core dependencies & security permissions                                       |
+------------------------------------------------------------------------------------------+
                                           |
                                           v
+------------------------------------------------------------------------------------------+
| PHASE 2: CROSS-PLATFORM HARDWARE DISCOVERY ENGINE                                        |
| - CPU topology (cores, caches, AVX/AVX2/AVX-512/NEON/AMX)                                |
| - GPU detection (NVIDIA NVML, AMD, Intel, Apple Silicon, CPU fallback)                   |
+------------------------------------------------------------------------------------------+
                                           |
                                           v
+------------------------------------------------------------------------------------------+
| PHASE 3: CPU BENCHMARKING ENGINE                                                         |
| - Single-core & multi-core mathematical compute                                          |
| - SIMD vectorized matrix multiply                                                        |
| - System RAM streaming bandwidth (Read/Write/Copy)                                       |
+------------------------------------------------------------------------------------------+
                                           |
                                           v
+------------------------------------------------------------------------------------------+
| PHASE 4: GPU BENCHMARKING ENGINE EXTENSIONS                                              |
| - Connect 5 GPU workloads to desktop runtime                                             |
| - Precision verification and live sampling                                               |
+------------------------------------------------------------------------------------------+
                                           |
                                           v
+------------------------------------------------------------------------------------------+
| PHASE 5: HARDWARE SAFETY GUARDRAILS & RESOURCE SUPERVISOR                                |
| - Memory safety reserve (larger of 20% or 2 GiB)                                         |
| - Hard 80°C thermal abort tripwire with cooldown                                         |
| - Non-blocking atomic cancellation token                                                 |
+------------------------------------------------------------------------------------------+
                                           |
                                           v
+------------------------------------------------------------------------------------------+
| PHASE 6: DESKTOP IPC BRIDGE & TAURI COMMAND LAYER                                        |
| - Typed Tauri IPC commands (`get_system_info`, `run_benchmark`, etc.)                    |
| - Real-time event streaming (`benchmark://progress`, `benchmark://telemetry`)            |
+------------------------------------------------------------------------------------------+
                                           |
                                           v
+------------------------------------------------------------------------------------------+
| PHASE 7: EMBEDDED SQLITE STORAGE & RUN HISTORY                                           |
| - Embedded `rusqlite` database schema in local AppData                                   |
| - Run record storage, historical diffs, JSON/CSV exports                                 |
+------------------------------------------------------------------------------------------+
                                           |
                                           v
+------------------------------------------------------------------------------------------+
| PHASE 8: DETERMINISTIC PERFORMANCE RATING ENGINE                                         |
| - MARDUK GPU Score & MARDUK CPU Score formulas                                           |
| - Hardware classification tiering (Tiers 1-5 & CPU Profile)                              |
+------------------------------------------------------------------------------------------+
                                           |
                                           v
+------------------------------------------------------------------------------------------+
| PHASE 9: PETALYX DESKTOP FRONTEND INTEGRATION                                            |
| - Dual-mode transport bridge (Tauri IPC when available, HTTP fallback)                   |
| - Desktop view modes: Overview, Hardware, Benchmark Suite, History, Settings             |
| - Preserve approved translucent glass aesthetic & subtle floating motion                 |
+------------------------------------------------------------------------------------------+
                                           |
                                           v
+------------------------------------------------------------------------------------------+
| PHASE 10: PACKAGING, INSTALLERS & DISTRIBUTION                                           |
| - Windows MSI & NSIS executable configuration                                            |
| - macOS DMG & Linux AppImage/deb packaging readiness                                     |
+------------------------------------------------------------------------------------------+
                                           |
                                           v
+------------------------------------------------------------------------------------------+
| PHASE 11: END-TO-END VERIFICATION & VALIDATION                                           |
| - Full workspace test suite execution (`cargo test --workspace`)                         |
| - Real hardware execution on host (Windows 11 + RTX 3050 A + 16 CPU cores)               |
| - SQLite persistence & telemetry verification                                            |
+------------------------------------------------------------------------------------------+
```

---

## 2. Detailed Phase Specifications

### Phase 1: Tauri 2 Desktop Shell Foundation & Workspace Setup
- Add Tauri 2 dependencies to the Cargo workspace.
- Create `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json` configuring native window dimensions, titles, permissions, and security scope.
- Link internal workspace crates (`marduk-core`, `marduk-nvml`, `marduk-bench`).

### Phase 2: Hardware Discovery Engine
- Enhance `marduk-core` and `marduk-nvml` with comprehensive CPU feature detection:
  - Detect AVX, AVX2, AVX-512, FMA3, NEON, AMX.
  - Detect physical vs logical cores, cache topology, RAM size.
  - Multi-GPU enumeration with fallback to CPU-only mode.

### Phase 3: CPU Benchmarking Engine
- Implement dedicated CPU benchmark suite in `marduk-bench`:
  - `run_cpu_compute_single()`: Single-thread numerical floating-point compute.
  - `run_cpu_compute_multi()`: Parallel Rayon-based multi-threaded GEMM.
  - `run_cpu_simd()`: Vectorized matrix multiply measuring SIMD speedup.
  - `run_cpu_memory()`: Multi-threaded RAM read, write, copy throughput in GB/s.

### Phase 4: GPU Benchmarking Engine Extensions
- Unify GPU workloads with CPU fallback workloads under a common `BenchmarkEngine` trait/struct.
- Ensure all 5 modules report real, non-zero values measured during actual compute iterations.

### Phase 5: Hardware Safety Guardrails & Resource Supervisor
- Implement preflight checks enforcing the 20% / 2 GiB VRAM barrier.
- Integrate continuous NVML and CPU temperature monitoring with the 80°C threshold.
- Implement immediate thread-safe cooperative cancellation.

### Phase 6: Desktop IPC Bridge & Tauri Command Layer
- Define strongly-typed Tauri commands in `src-tauri`:
  - `get_system_info`
  - `list_devices`
  - `run_benchmark`
  - `cancel_benchmark`
  - `get_benchmark_status`
  - `get_benchmark_history`
  - `get_system_rating`
  - `export_results`
- Emit Tauri events for live progress and telemetry.

### Phase 7: Embedded SQLite Storage & Run History
- Implement `marduk_bench::storage` using `rusqlite`.
- Create tables: `runs`, `metrics`, `telemetry_samples`, `hardware_snapshots`.
- Expose methods to query history and export to JSON/CSV.

### Phase 8: Deterministic Performance Rating Engine
- Implement formula-based scoring in `marduk_bench::rating`.
- Compute separate MARDUK GPU Score and MARDUK CPU Score.
- Output hardware classification tier.

### Phase 9: Petalyx Desktop Frontend Integration
- Create `frontend/src/desktop/` or enhance `frontend/src/api.ts` with a transparent IPC adapter:
  - If running in Tauri: call `window.__TAURI_INTERNALS__.invoke` and subscribe via `listen`.
  - If running in web browser: call HTTP REST endpoints (`/api/...`).
- Integrate desktop navigation for Overview, Hardware, Benchmarks, History, and Settings while preserving the 5 glass cards and Petalyx animations.

### Phase 10: Packaging & Multi-Platform Distribution
- Configure Tauri bundler icons, application metadata, and distribution targets.
- Provide build scripts (`npm run tauri build`).

### Phase 11: End-to-End Verification & Validation
- Execute `cargo test --workspace` across all crates.
- Execute real benchmark runs on the active host GPU and CPU.
- Verify that metrics are recorded in SQLite and reflected in the UI.

