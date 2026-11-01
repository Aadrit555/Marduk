# MARDUK Desktop — Architecture Specification

## 1. Executive Summary & Vision

**MARDUK Desktop** is a native, cross-platform hardware benchmarking, stress analysis, and inference performance profiling application built with **Tauri 2**, a high-performance **Rust** systems core, and an approved, motion-rich **React 18 / TypeScript** user interface adhering to the Petalyx design system.

### Core Architecture Axioms
1. **Separation of Deployment Targets**:
   - **MARDUK Web** (`frontend/` + `marduk serve`): Marketing portal, interactive architecture explorer, platform documentation, live web-accessible cluster telemetry, and desktop installer distribution.
   - **MARDUK Desktop** (`src-tauri` / Tauri 2 native shell): Installed application operating with full OS privileges, zero-configuration local execution, direct hardware telemetry (NVML, sysinfo, CPUID), local SQLite persistence, and offline benchmarking capabilities.
2. **Zero Simulation — 100% Genuine Workloads**:
   - The desktop client never generates fake scores, simulated progress bars, or synthetic approximations.
   - Every metric reported (TFLOPS, GB/s, TTFT, TPS, temperature delta, clock consistency) derives from actual executed numerical computation, memory transfer, or local model token generation.
3. **First-Class CPU and GPU Parity**:
   - Systems lacking dedicated discrete GPUs (e.g., ultrabooks, servers, developer workstations with integrated graphics) are treated as first-class citizens with dedicated CPU single-core, multi-core, AVX/SIMD vectorization, and RAM bandwidth test suites.
   - Systems without dedicated GPUs are never assigned an artificial score of zero or an error state.
4. **Deterministic Safety Guardrails**:
   - Hardware protection is guaranteed by design: a strict VRAM reserve (the larger of 20% or 2 GiB), an 80°C hard thermal abort tripwire with automatic cooldown enforcement, preflight memory allocation validation, and sequential single-run concurrency locks.

---

## 2. High-Level Component Topology

```
+---------------------------------------------------------------------------------------+
|                                    MARDUK DESKTOP                                     |
+---------------------------------------------------------------------------------------+
|  FRONTEND PRESENTATION LAYER (React 18 + TypeScript + Tailwind CSS + GSAP + Lenis)    |
|  - Petalyx Aesthetic (Translucent Glass Panels, Ambient Drift, Micro-interactions)    |
|  - View Modes: System Overview, Hardware Topology, Benchmark Suite, History, Settings |
|  - Dual IPC Transport Bridge (Tauri IPC `invoke` / Fallback HTTP REST & SSE)          |
+-------------------------------------------^-------------------------------------------+
                                            | Tauri 2 IPC Channel
                                            v
+---------------------------------------------------------------------------------------+
|  TAURI 2 APPLICATION SHELL & COMMAND DISPATCHER (Rust)                                |
|  - Window Management & Native Chrome (Windows Mica/Acrylic, macOS Vibrancy)          |
|  - Command Invocations (`get_system_info`, `run_benchmark`, `cancel_benchmark`, etc.) |
|  - Real-Time Event Bus (`benchmark://progress`, `benchmark://telemetry`)              |
+-------------------------------------------^-------------------------------------------+
                                            |
+-------------------------------------------v-------------------------------------------+
|  MARDUK SYSTEMS ENGINE (Rust Crates)                                                  |
|                                                                                       |
|  +---------------------------+  +---------------------------+  +-------------------+  |
|  | Hardware Discovery Engine |  | Benchmark Engine          |  | Safety Supervisor |  |
|  | - CPUID & SIMD Probing    |  | - Module 01: Compute Core |  | - VRAM Reserve    |  |
|  | - NVML (NVIDIA)           |  | - Module 02: VRAM Speed   |  | - 80°C Tripwire   |  |
|  | - ROCm / Sysfs (AMD)      |  | - Module 03: Tensor Cores |  | - Cooldown Delay  |  |
|  | - Metal / IOKit (Apple)   |  | - Module 04: AI Inference |  | - Mutex Lock      |  |
|  | - sysinfo (RAM, Cores)    |  | - Module 05: Thermal Stress| | - Atomic Cancel   |  |
|  +---------------------------+  +---------------------------+  +-------------------+  |
|                                                                                       |
|  +---------------------------------------------+  +--------------------------------+  |
|  | Local Storage Engine (Embedded SQLite)      |  | Performance Rating Engine      |  |
|  | - Run Records & Metrics Timeseries          |  | - Deterministic Scoring Matrix |  |
|  | - Hardware Baseline Snapshots               |  | - CPU & GPU Independent Scores |  |
|  | - JSON / CSV Export Pipeline                |  | - Hardware Class Categorization|  |
|  +---------------------------------------------+  +--------------------------------+  |
+---------------------------------------------------------------------------------------+
```

---

## 3. Detailed Subsystem Architecture

### 3.1. Frontend Presentation Layer
- **Framework**: React 18, TypeScript, Tailwind CSS, GSAP for fluid timeline animations, Lucide React icons, and Studio Freight Lenis for inertia-based smooth scrolling.
- **Glassmorphic UI**: Translucent floating panels with subtle multi-axis drift (`dx`, `dy`), glass borders (`rgba(255,255,255,0.12)`), and backdrop blur (16px to 24px) against scenic landscape backdrops.
- **Dual-Mode Transport Bridge**:
  ```typescript
  export const isTauriEnvironment = (): boolean => {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  };
  ```
  - When running inside the Tauri 2 desktop shell, all calls route directly to native IPC commands (`invoke('run_benchmark', { ... })`) with real-time push events (`listen('benchmark://progress')`).
  - When opened in a standard web browser (connecting to `marduk serve`), the frontend transparently falls back to the HTTP REST API (`/api/bench/run`) and Server-Sent Events (`/api/telemetry/stream`), ensuring a unified codebase.

### 3.2. Tauri 2 Desktop Shell (`src-tauri`)
- **Native Windowing**: Configured with native decorations, minimal window sizes (1024x720), default launch dimensions (1366x820), and hardware-accelerated rendering.
- **IPC Protocol**: All parameters and responses are strongly typed via Serde. Zero JSON string wrestling across the boundary.
- **Background Event Streaming**: Long-running benchmark workloads push telemetry samples (GPU clock, temperature, fan speed, VRAM usage) at 100ms intervals directly into the Tauri window event bus without blocking UI reactivity.

### 3.3. Hardware Discovery Engine
- **CPU Discovery**:
  - Processor model, vendor (Intel, AMD, Apple, Qualcomm).
  - Physical core count, logical thread count, base frequency, current frequency.
  - L1/L2/L3 cache capacities.
  - Instruction set extensions: SSE4.2, AVX, AVX2, AVX-512, FMA3, NEON, AMX.
  - Total and available system RAM.
- **GPU Discovery**:
  - **NVIDIA**: Native NVML integration via dynamic symbol loading (`nvml_wrapper`), querying device name, UUID, PCI bus ID, total/free VRAM, CUDA compute capability (e.g., 8.9 for Ada Lovelace), driver version, and CUDA version.
  - **AMD / Intel / Generic**: Discovery via platform sysfs, DirectX/DXGI (Windows), Level Zero (Intel), or Vulkan API.
  - **Apple Silicon**: Unified memory architecture identification via `sysctl` and Metal device querying (`MTLCopyAllDevices`).
  - **CPU-Only Fallback**: If no discrete or integrated accelerator is discovered, the engine configures a pure host CPU execution profile.

### 3.4. Benchmark Execution Engine
The benchmark engine implements 5 core hardware modules, each capable of running on GPU or CPU fallback:

| Module | Purpose | GPU Implementation | CPU Implementation | Primary Metric |
|---|---|---|---|---|
| **01. Compute Core** | Raw compute throughput | Bounded tiled FP32/FP16 GEMM with cache locality | Multi-threaded AVX2/AVX-512 tiled GEMM matrix multiply | TFLOPS / GFLOPS |
| **02. Memory Speed** | Memory subsystem bandwidth | Sequential & strided VRAM read/write streaming | Multi-core streaming RAM read, write, copy (STREAM-style) | GB/s |
| **03. Tensor / SIMD** | Specialized matrix math | Mixed-precision Tensor Core GEMM (FP16 $\to$ FP32) | SIMD vectorized FMA3/AVX2 fused multiply-add operations | TFLOPS & Speedup |
| **04. AI Inference** | Real model latency & tokens | Worker-supervised inference (TTFT, TPS, token stream) | Local CPU quantized model inference with token streaming | TTFT (ms), TPS |
| **05. Thermal & Stress** | Sustained load stability | Continuous compute stress with NVML telemetry tracking | Sustained multi-threaded CPU stress with core temp tracking | Temp $\Delta$°C, Stability % |

### 3.5. Safety Supervisor & Guardrails
- **VRAM Reserve**: Allocations dynamically compute:
  $$\text{Reserve} = \max(0.20 \times \text{Total VRAM}, 2 \text{ GiB})$$
  Allocations exceeding $\text{Free VRAM} - \text{Reserve}$ are rejected at preflight.
- **Thermal Abort Tripwire**: Telemetry is polled continuously during workloads. If temperature reaches **80.0°C**, the engine immediately fires an abort signal, halts iteration loops, releases memory, and transitions the state machine to `SafetyAborted`.
- **Hysteresis Cooldown**: Following a thermal abort or heavy stress test, the supervisor locks new test starts until temperatures drop at least 10°C below peak.
- **Atomic Cancellation**: Every workload loop checks an `Arc<AtomicBool>` cancellation token between tile computations, ensuring sub-50ms reaction to user stop commands.
- **Sequential Concurrency Lock**: An async `Mutex<Option<JobId>>` guarantees that stress workloads can never be executed concurrently on the same hardware.

### 3.6. Local Storage Engine (Embedded SQLite)
- **Database File**: Stored in standard platform application data directories:
  - Windows: `%APPDATA%\marduk\marduk.db`
  - Linux: `~/.local/share/marduk/marduk.db`
  - macOS: `~/Library/Application Support/marduk/marduk.db`
- **Engine**: Embedded `rusqlite` operating in Write-Ahead Logging (WAL) mode for high-concurrency non-blocking reads.
- **Schema Entities**:
  - `hardware_snapshots`: Host hardware topology, CPU specifications, GPU attributes, driver revisions.
  - `benchmark_runs`: Run ID, timestamp, benchmark type, target device, duration, status.
  - `benchmark_metrics`: Achieved TFLOPS, bandwidth GB/s, TTFT, TPS, temperature delta, power draw, stability rating.
  - `telemetry_samples`: Timeseries records of clock speed, temperature, and power for charting.
- **Export Capabilities**: Clean JSON and CSV export endpoints for offline archiving and sharing.

### 3.7. Performance Rating Engine
- Computes deterministic, normalized scores based on empirical measurements compared against calibrated reference hardware baselines:
  - **MARDUK CPU Score**: Weighted combination of Single-Core Compute (30%), Multi-Core Compute (40%), SIMD Vectorization (15%), and RAM Bandwidth (15%).
  - **MARDUK GPU Score**: Weighted combination of Compute Core TFLOPS (40%), Memory Bandwidth (30%), Hardware Matrix Acceleration (15%), and Thermal Stability (15%).
  - **Overall Rating**: Transparent hardware classification tier (Tier 1: Enthusiast/Datacenter, Tier 2: High Performance, Tier 3: Balanced Workstation, Tier 4: Mainstream, Tier 5: Entry/Low Power) plus an explicit CPU-Only profile.

---

## 4. Security, Isolation, and Privileges
- No kernel drivers or unsafe ring-0 operations are required.
- NVML communicates via standard user-mode NVIDIA management dynamic libraries (`nvml.dll` / `libnvidia-ml.so.1`).
- CPU discovery relies on standard user-mode instructions (`CPUID`, OS performance counters via `sysinfo`).
- Local SQLite database resides strictly within user application directories with standard user permissions.

