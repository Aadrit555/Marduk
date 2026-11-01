# MARDUK

**Know what your machine can really do.**

MARDUK is a local-first, cross-platform hardware benchmarking and performance analysis application engineered in Rust and TypeScript/React. It measures and explains the real performance of your computer's CPU, GPU, memory, and local AI inference workloads with verifiable measurements, intelligent hardware detection, and built-in safety controls.

---

## 1. Product Overview

- **Public Website**: Introduces MARDUK, explains platform compatibility, hosts documentation, and distributes verified desktop installers.
- **Desktop Application (`marduk-desktop`)**: Native Tauri 2 desktop shell that executes hardware benchmarks locally, samples hardware telemetry, computes deterministic ratings, and records history offline in an embedded SQLite database.
- **CLI Tooling (`marduk-cli`)**: Headless command-line binary (`marduk bench`, `marduk serve`, `marduk gpus`) for automated testing, continuous integration, and server environments.

---

## 2. Core Benchmark Suites

Assigning one verified test workload to each hardware category:

1. **01 — Compute Core**:
   - CPU: Single-core IPC and Rayon multi-threaded tiled matrix multiplication (GEMM).
   - GPU: Numerical FP32 matrix workloads measuring actual operations per second (TFLOPS).
   - Real execution timing with nanosecond resolution and verifiable dimensions.

2. **02 — Memory Bandwidth**:
   - System RAM: Multi-threaded STREAM-style bandwidth throughput (GB/s).
   - GPU VRAM: Copy, scale, and triad memory throughput.
   - Preserves a guaranteed 20% or 2 GiB memory headroom to prevent out-of-memory thrashing. On Apple Silicon, unified memory is correctly identified without fabricating separate VRAM numbers.

3. **03 — Hardware Acceleration**:
   - Instruction Set Discovery: Detects AVX-512, AVX2, FMA3, SSE4.2, ARM NEON, and AMX.
   - Accelerators: Validates NVIDIA Tensor Cores, Apple Metal, and Vulkan backends.
   - Evaluates numerical error against reference outputs.

4. **04 — Local AI Inference**:
   - Measures Time to First Token (TTFT) and token generation latency (ITL).
   - Measures real tokens/second on physical local model weights across INT4, INT8, and FP16 quantizations.

5. **05 — Thermal & Stability Monitoring**:
   - Continuous sampling of junction temperature, instantaneous power draw, and clock frequencies via direct NVML bindings.
   - **Hard Safety Guardrail**: Immediate workload abort if core temperature reaches or exceeds 80°C.

---

## 3. Product Principles

- **No Fake Telemetry**: All metrics derive from real physical execution. No synthetic mock numbers or fabricated utilization curves.
- **First-Class CPU Support**: Systems without dedicated GPUs (e.g. ultrabooks) receive a complete, first-class benchmarking experience with tailored CPU ratings.
- **Local-First Privacy**: Benchmark runs, hardware specifications, and system ratings are stored locally in an embedded SQLite WAL database. No cloud account or external telemetry transmission is required.
- **Safe by Design**: Workloads are bounded in duration, enforce sequential execution locks, monitor thermal sensors, and support immediate cancellation.

---

## 4. Architecture & Cargo Workspace

```
marduk/
├── Cargo.toml                    # Root workspace configuration
├── crates/
│   ├── marduk-core/              # Hardware models, config, metrics primitives
│   ├── marduk-bench/             # Benchmark engines (CPU GEMM, RAM, SQLite storage, Rating)
│   ├── marduk-nvml/              # Zero-allocation NVML C FFI bindings & fallback sysinfo
│   ├── marduk-api/               # Axum HTTP routes & SSE event streams
│   ├── marduk-scheduler/         # Deterministic scoring & queue constraints
│   ├── marduk-worker/            # Worker process supervision & inference adapters
│   ├── marduk-learned/           # Workload execution time predictor
│   └── marduk-cli/               # CLI binary (bench, serve, gpus)
├── src-tauri/                    # Tauri 2 native desktop application shell
│   ├── src/lib.rs                # Desktop IPC commands (system info, run bench, ratings, export)
│   └── tauri.conf.json           # Native desktop window & bundle configuration
├── frontend/                     # Petalyx-inspired React/TypeScript web application
│   ├── src/components/Hero.tsx   # Scenic hero with 5 floating animated glass modules
│   ├── src/components/BenchmarkModal.tsx # Interactive test runner, live metrics & ratings
│   └── src/index.css             # Floating glass keyframes & Petalyx styling
└── docs/                         # Canonical product specifications & documentation
```

---

## 5. Quick Start

### Prerequisites

- **Rust**: 1.80+ (MSRV)
- **Node.js**: 18+ and `npm`
- **C/C++ Build Tools**: MSVC on Windows, Xcode on macOS, GCC/Clang on Linux
- **Optional**: NVIDIA GPU with Display Drivers supporting NVML

### Build and Run Desktop Application

```powershell
# Run the native desktop application (Tauri 2)
cargo run -p marduk-desktop
```

### Run CLI Benchmarks Headlessly

```powershell
# Run hardware discovery and CPU/GPU benchmarks from the terminal
cargo run -p marduk -- bench --profile quick
```

### Run Full Test Suite

```powershell
# Run all workspace unit and integration tests (100% pass)
cargo test --workspace

# Run strict clippy verification
cargo clippy --workspace -- -D warnings
```

### Build Web Interface

```powershell
cd frontend
npm install
npm run build
```

---

## 6. Supported Platforms

| Platform | Compute Backends | Memory Support | Sensor Monitoring | Installer Status |
| :--- | :--- | :--- | :--- | :--- |
| **Windows x64** | Multi-threaded CPU, AVX2, NVIDIA CUDA | RAM + Dedicated VRAM | NVML (Temp, Power, Clocks) | **Validated v0.1.0 Binary** |
| **macOS (Apple Silicon)** | Multi-threaded CPU, ARM NEON, Metal | Unified Memory Parity | macOS system telemetry | In Active Validation |
| **Linux (x86_64)** | Multi-threaded CPU, AVX2/512, CUDA/ROCm | RAM + Dedicated VRAM | NVML / sysfs | In Active Validation |
| **CPU-Only (All OS)** | Rayon Tiled GEMM, SIMD Vectorization | Host RAM Bandwidth | Host thermal monitors | **Fully Supported** |

---

## 7. License & Credits

Designed and maintained for the MARDUK Project. Built with Rust, Tauri, React, and Tailwind CSS.
Visual composition inspired by Petalyx design principles.
