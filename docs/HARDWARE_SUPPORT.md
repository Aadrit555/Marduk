# MARDUK Desktop — Hardware Support Matrix & Detection Engine

## 1. Operating System Support Matrix

| Platform | Architecture | Minimum Version | Native GUI Engine | GPU Discovery Layers | CPU Discovery Layers |
|---|---|---|---|---|---|
| **Windows** | x86_64 | Windows 10 (1903+) / Windows 11 | Microsoft Edge WebView2 (Chromium) | NVML (`nvml.dll`), DXGI, Vulkan | CPUID, Win32 SystemInfo, `sysinfo` |
| **Linux** | x86_64, aarch64 | Ubuntu 22.04+, Debian 12+, Fedora 38+, Arch | WebKitGTK 4.1 | NVML (`libnvidia-ml.so.1`), ROCm, DRM/sysfs, Vulkan | `/proc/cpuinfo`, `sysfs`, `sysinfo` |
| **macOS** | Apple Silicon (arm64), Intel (x86_64) | macOS 12 (Monterey)+ | WKWebView (WebKit) | Metal 3 API, IOKit registry | `sysctl`, Mach kernel host statistics, `sysinfo` |

---

## 2. CPU Architecture Support & Instruction Vectorization

MARDUK features an instruction-level CPU discovery and benchmarking engine designed to measure raw arithmetic throughput, cache hierarchies, and vector execution capabilities across all modern desktop and server processor architectures.

### 2.1. x86_64 Architecture (Intel & AMD)
- **Vendors**:
  - **Intel**: Core i3/i5/i7/i9 (Generations 6th through 14th+), Core Ultra (Meteor Lake / Arrow Lake), Xeon Scalable (Skylake-SP through Emerald Rapids).
  - **AMD**: Ryzen 3/5/7/9 (Zen 1 through Zen 5), Threadripper, EPYC (Naples through Turin).
- **Probed Instruction Set Extensions**:
  - `SSE4.1` / `SSE4.2`: Baseline 128-bit vector arithmetic.
  - `AVX` / `AVX2`: 256-bit wide SIMD execution for floating-point and integer vector operations.
  - `FMA3`: Fused Multiply-Add ($a \times b + c$) in a single CPU cycle.
  - `AVX-512` (F, CD, BW, DQ, VL): 512-bit ultra-wide vector execution with masking registers.
  - `AMX` (Advanced Matrix Extensions): Tile matrix multiplication units on Intel Sapphire Rapids / Emerald Rapids.
- **Cache Topology**:
  - Probes L1 Data, L1 Instruction, L2 unified/dedicated, and L3 shared cache sizes.
  - Benchmarks measure bandwidth at cache-fitting vs. cache-spilling working set sizes.

### 2.2. ARM64 Architecture (Apple Silicon, Qualcomm, Enterprise ARM)
- **Platforms**:
  - **Apple Silicon**: M1, M1 Pro, M1 Max, M1 Ultra, M2 series, M3 series, M4 series.
  - **Qualcomm**: Snapdragon X Elite, Snapdragon X Plus (Oryon CPU cores).
  - **Enterprise ARM**: AWS Graviton 3/4, Ampere Altra / Altra Max.
- **Probed Vector & Matrix Extensions**:
  - `NEON`: Standard 128-bit SIMD vector engine across all ARM64 cores.
  - `SVE` / `SVE2`: Scalable Vector Extensions for dynamic vector length processing.
  - `Apple AMX`: Proprietary Apple Matrix Coprocessor accessible via Accelerate framework.

---

## 3. GPU Architecture & Telemetry Support

### 3.1. NVIDIA Discrete GPUs
NVIDIA hardware is supported with direct user-mode dynamic NVML interfacing and CUDA compute capability detection.

| Architecture | Microarchitecture | Compute Capability | Tensor Core Generation | Supported Precision Modes |
|---|---|---|---|---|
| **Blackwell** | B100, B200, RTX 50-series | 10.0 / 10.1 | 5th-Gen Tensor Cores | FP64, FP32, TF32, FP16, BF16, FP8, FP4, INT8, INT4 |
| **Hopper** | H100, H200, GH200 | 9.0 | 4th-Gen Tensor Cores | FP64, FP32, TF32, FP16, BF16, FP8, INT8 |
| **Ada Lovelace** | RTX 4090, 4080, 4070, 3050 A | 8.9 | 4th-Gen Tensor Cores | FP64, FP32, TF32, FP16, BF16, FP8, INT8 |
| **Ampere** | RTX 3090, 3080, A100, A10 | 8.0, 8.6 | 3rd-Gen Tensor Cores | FP64, FP32, TF32, FP16, BF16, INT8, INT4 |
| **Turing** | RTX 2080, 2070, T4 | 7.5 | 2nd-Gen Tensor Cores | FP32, FP16, INT8, INT4 |
| **Volta** | Titan V, V100 | 7.0 | 1st-Gen Tensor Cores | FP32, FP16 |
| **Pascal** | GTX 1080 Ti, 1070, P100 | 6.0, 6.1 | None (Scalar FP32/FP16) | FP32, FP16 |

**NVML Telemetry Capabilities**:
- Real-time graphics and memory clock speeds (MHz).
- Real-time temperature (°C) and thermal threshold flags.
- Real-time power draw (mW) and maximum board power limits.
- Precise VRAM allocation (total, used, free bytes).
- PCIe TX/RX throughput metrics.
- Throttling flags: Thermal Slowdown, Power Brake, Hardware Reliability, SW Power Cap.

### 3.2. AMD Discrete & APU GPUs
- **Architectures**: RDNA 1 (RX 5000), RDNA 2 (RX 6000), RDNA 3 (RX 7000), CDNA 1/2/3 (MI100/MI200/MI300).
- **APUs**: AMD Ryzen with Radeon 680M, 780M, 890M graphics.
- **Interfaces**:
  - Linux: ROCm runtime (`/opt/rocm`), sysfs hwmon (`/sys/class/drm/card*/device/hwmon`), AMDGPU DRM driver.
  - Windows: ADL (AMD Display Library), DXGI adapter enumeration, Vulkan compute queue.
- **Matrix Acceleration**: Probes AMD Matrix Core (AI Accelerators) support.

### 3.3. Intel Discrete & Integrated Graphics
- **Discrete**: Intel Arc Alchemist (A770, A750, A380), Intel Arc Battlemage.
- **Integrated**: Intel UHD Graphics, Iris Xe Graphics, Intel Arc GPU (Meteor Lake).
- **Interfaces**: Level Zero API (`ze_loader`), oneAPI, DXGI on Windows, Vulkan compute shaders.
- **Matrix Acceleration**: Intel XMX (Xe Matrix Extensions) support detection.

### 3.4. Apple Silicon Unified Architecture
- **Unified Memory Model**:
  - CPU and GPU share a single, ultra-wide unified memory bus (e.g., up to 800 GB/s on M-series Ultra chips).
  - Zero-copy buffer sharing between host compute and Metal compute pipelines.
- **Interfaces**:
  - Metal 3 Compute Framework (`MTLDevice`, `MTLCommandQueue`).
  - Metal Performance Shaders (MPS) for high-performance matrix multiplications.
  - IOKit and `sysctl` for thermal pressure and memory allocation statistics.

---

## 4. First-Class CPU-Only Mode

A foundational requirement of MARDUK Desktop is **flawless operation on systems without a dedicated GPU**.

### Guiding Principles:
1. **Never Report Zero or Error**:
   - When no GPU is detected, MARDUK seamlessly switches the primary hardware view to **CPU & System Memory Architecture**.
   - The UI displays full processor topology, SIMD capabilities, memory speed, and thermal stability.
2. **CPU Benchmark Parity**:
   - The 5 benchmark modules automatically adapt:
     - Module 01 executes multi-threaded tiled GEMM utilizing AVX2/AVX-512/NEON.
     - Module 02 executes STREAM-style RAM read/write/copy bandwidth tests.
     - Module 03 measures SIMD vectorization speedup relative to scalar execution.
     - Module 04 executes CPU-quantized inference using GGML/llama.cpp-compatible execution or SIMD matrix tokens.
     - Module 05 monitors sustained CPU package temperature and multi-core throttling.
3. **Dedicated MARDUK CPU Rating**:
   - The system generates an official **MARDUK CPU Performance Score** calibrated against reference modern CPUs, allowing laptops and servers to be compared accurately.

