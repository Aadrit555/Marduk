# MARDUK

**MARDUK** is an intelligent GPU inference orchestration and resource management platform engineered in Rust. It manages multiple local AI inference workers, distributes generative workloads intelligently across GPUs, monitors real hardware telemetry, improves GPU utilization through measured scheduling decisions, and provides a unified OpenAI-compatible interface for running AI models.

---

## 1. Core Problems Solved

1. **Multi-GPU Worker Sprawl**: Managing multiple heterogeneous GPU inference processes and device affinities manually is error-prone and brittle.
2. **Inefficient Workload Distribution**: Static round-robin routing ignores memory pressure, queue depths, prompt lengths, and KV cache locality.
3. **VRAM Exhaustion and Thrashing**: Launching requests without admission control causes out-of-memory (OOM) crashes and expensive model swapping.
4. **Queue Congestion**: Lack of backpressure and cancellation causes inference queues to back up with stale requests.
5. **Black-Box Scheduling**: Developers lack visibility into *why* an inference request was assigned to a particular GPU or worker.
6. **Fragmented Observability**: Disconnected GPU metrics (NVML), worker statuses, and inference latencies make capacity planning difficult.

---

## 2. Key Features

- **Hardware Discovery & NVML Telemetry**: Real-time monitoring of NVIDIA GPUs (VRAM capacity, allocated memory, compute utilization %, encoder/decoder engines, temperature, power draw, clock speeds) via direct NVML bindings with graceful non-fabricating fallbacks.
- **Worker Lifecycle Management**: Process supervision, GPU device affinity (`CUDA_VISIBLE_DEVICES`), model allocation, health heartbeats, failure recovery, and graceful shutdown.
- **Explainable Multi-Factor Scheduler**:
  - *Hard Constraint Filtering*: Enforces health requirements, model compatibility, queue capacity, and strict VRAM headroom thresholds.
  - *Scoring Function*: Ranks viable workers using queue wait time estimation ($T_{wait} = N_{queue} \times \bar{T}_{service}$), prompt token computation budget, resource pressure penalties, and model residency bonuses.
  - *Explainability Engine*: Every routing decision logs candidate workers, disqualification rationales, and exact score components.
- **Admission Control & Backpressure**: Bounded queues, client cancellation propagation, priority bands, and standard HTTP 429 / 503 backpressure signals.
- **Unified OpenAI-Compatible API**:
  - `GET /v1/models`
  - `POST /v1/chat/completions` (Server-Sent Events streaming & non-streaming)
  - Full operational telemetry suite: `/health`, `/ready`, `/metrics`, `/api/v1/gpus`, `/api/v1/workers`, `/api/v1/models`, `/api/v1/metrics`, `/api/v1/scheduler/decisions`.
- **Learned Workload Predictor (Burn)**: Deep-learning prediction module built with Burn (using autodiff and reproducible execution traces) to forecast prefill and decode execution times and peak memory demand.
- **Production Dashboard**: High-fidelity observability web application presenting live GPU telemetry, worker topology, queue dynamics, scheduler decision feeds, and latency distributions.
- **Reproducible Benchmark Suite**: Rigorous harness measuring RPS, TPS, TTFT (Time to First Token), ITL (Inter-Token Latency), P50/P95/P99 latency, and orchestration overhead.

---

## 3. Architecture Overview

```
                                +------------------------------------------+
                                |               Client Apps                |
                                +------------------------------------------+
                                                     |
                                            HTTP / SSE Streams
                                                     v
+----------------------------------------------------------------------------------------------------+
|                                            MARDUK Platform                                         |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                  Unified API & Control Plane                                 |  |
|  |     /v1/chat/completions   |   /v1/models   |   /api/v1/gpus   |   /api/v1/workers           |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                |                                                   |
|                        +-----------------------+-----------------------+                           |
|                        v                                               v                           |
|  +-------------------------------------------+   +-----------------------------------------------+ |
|  |            Intelligent Scheduler          |   |              GPU Resource Manager             | |
|  |  * Hard Constraint Filter (VRAM/Health)   |   |  * NVML Device Discovery & Telemetry          | |
|  |  * Multi-Factor Cost Scoring Function     |   |  * Memory Headroom & Thermal Tracking         | |
|  |  * Admission Control & Bounded Queues     |<--|  * Real Metrics Poller (100ms - 1s cadence)   | |
|  |  * Decision Audit & Rationale Logging     |   |  * No fabricated metrics fallback             | |
|  +-------------------------------------------+   +-----------------------------------------------+ |
|                        |                                                                           |
|                        v                                                                           |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                      Worker Manager                                          |  |
|  |  * Worker Supervision & Auto-restart     * Device Affinity (CUDA_VISIBLE_DEVICES)            |  |
|  |  * Health Heartbeats & Timeout Watcher   * Stream Cancellation & Channel Multiplexing        |  |
|  +----------------------------------------------------------------------------------------------+  |
|               |                                  |                                  |              |
+---------------|----------------------------------|----------------------------------|--------------+
                v                                  v                                  v
       +-----------------+                +-----------------+                +-----------------+
       | Worker 0 (GPU 0)|                | Worker 1 (GPU 0)|                | Worker 2 (GPU 1)|
       | mistral.rs / LLM|                | mistral.rs / LLM|                | mistral.rs / LLM|
       +-----------------+                +-----------------+                +-----------------+
```

See [ARCHITECTURE.md](file:///c:/Users/Aadrit/Desktop/Marduk/ARCHITECTURE.md) for detailed architectural documentation.

---

## 4. Hardware Requirements & Support

- **Supported GPUs**: NVIDIA Ampere, Ada Lovelace, Hopper, Blackwell, and Turing architectures (e.g. RTX 30xx/40xx, A100, H100, L40S, V100).
- **VRAM**: Supports configurations from single 4GB laptop GPUs up to multi-GPU 80GB+ servers with automatic VRAM-aware batch budgeting.
- **Drivers**: NVIDIA Display Driver with NVML support (`nvml.dll` on Windows, `libnvidia-ml.so` on Linux).
- **CPU & Fallback**: Systems without NVIDIA GPUs gracefully fall back to host CPU inference and system memory telemetry without inventing synthetic GPU statistics.

---

## 5. Quick Start

### Prerequisites
- Rust 1.80+ (MSRV)
- NVIDIA Drivers installed (for GPU telemetry and hardware acceleration)
- Node.js 18+ (for dashboard frontend build)

### Build and Test
```powershell
# Build all workspace crates
cargo build

# Run unit and integration tests
cargo test

# Run linter and formatting check
cargo clippy --all-targets --all-features -- -D warnings
cargo fmt --check
```

### Run MARDUK
```powershell
# Run the MARDUK server
cargo run -p marduk -- serve --host 127.0.0.1 --port 8080 --config config/marduk.toml

# Check GPU hardware discovery
cargo run -p marduk -- gpus

# Inspect registered workers
cargo run -p marduk -- workers
```

### Launch the Web Dashboard
```powershell
# Navigate to dashboard
cd dashboard
npm install
npm run dev
# Dashboard available at http://localhost:5173
```

---

## 6. API Reference Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/v1/models` | GET | OpenAI-compatible list of loaded and available models |
| `/v1/chat/completions` | POST | OpenAI-compatible chat completion (streaming SSE & json) |
| `/health` | GET | Simple liveness probe |
| `/ready` | GET | Readiness probe checking worker availability |
| `/metrics` | GET | Prometheus exposition format metrics |
| `/api/v1/gpus` | GET | Real-time NVML hardware metrics and telemetry |
| `/api/v1/workers` | GET | Worker statuses, queue depths, device affinities |
| `/api/v1/workers` | POST | Register or spawn a new inference worker |
| `/api/v1/workers/:id` | DELETE | Gracefully shut down a worker |
| `/api/v1/scheduler/decisions`| GET | Audit log of recent routing decisions and rationales |
| `/api/v1/metrics` | GET | High-level metrics JSON (RPS, TPS, TTFT, P95, queue) |

---

## 7. License

Apache 2.0 or MIT.
