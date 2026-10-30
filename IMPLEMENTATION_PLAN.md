# MARDUK Implementation Plan

This document outlines the step-by-step engineering plan for delivering MARDUK according to the Master Engineering Directive.

---

## Phase 0: Workspace & Environment Inspection (Completed)
- [x] Inspect host platform: Windows 11 (64-bit), Visual Studio Build Tools 2026.
- [x] Verify GPU hardware: NVIDIA GeForce RTX 3050 Laptop GPU (Device 0, 4094 MiB VRAM), Driver 616.92, CUDA 13.4.
- [x] Verify NVML library: `C:\Windows\System32\nvml.dll` confirmed present and accessible.
- [x] Install and configure Rust toolchain: `rustc 1.99.1`, `cargo 1.99.1`, `clippy`, `rustfmt`.
- [x] Verify Node.js and Git: Node.js v24.11.1, npm 11.6.2, Git 2.4x.
- [x] Initialize Git repository.
- [x] Formulate architecture, development, and implementation blueprints (`README.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `DEVELOPMENT.md`).

---

## Phase 1: Working Rust Foundation
- [ ] Initialize Cargo workspace with modular crates:
  - `crates/marduk-core`: Data types, config structs, error hierarchy, domain models.
  - `crates/marduk-nvml`: Hardware discovery & real-time NVML telemetry engine.
  - `crates/marduk-worker`: Worker abstraction, supervisor, backend adapters.
  - `crates/marduk-scheduler`: Deterministic multi-factor scheduler & backpressure.
  - `crates/marduk-learned`: Burn-based neural workload predictor and trace training pipeline.
  - `crates/marduk-api`: Axum HTTP server, SSE token streaming, OpenAI endpoints, operational metrics.
  - `crates/marduk-bench`: Performance benchmark harness.
  - `crates/marduk-cli`: Main executable binary.
- [ ] Implement `marduk-core`:
  - Typed configuration parsing (`marduk.toml`).
  - Structured logging with `tracing` and `tracing-subscriber`.
  - Canonical error handling with `thiserror`.
- [ ] Implement `marduk-nvml`:
  - Safe NVML initialization using `nvml-wrapper`.
  - Periodic background telemetry loop updating thread-safe metrics cache.
  - Non-fabricating fallback for environments without active GPUs.
- [ ] Implement `marduk-api` baseline:
  - Liveness (`/health`) and readiness (`/ready`) endpoints.
  - Prometheus exposition (`/metrics`).
  - Hardware status (`/api/v1/gpus`).
- [ ] Verification: `cargo fmt`, `cargo check`, `cargo test`, `cargo clippy`.

---

## Phase 2: Inference Workers and Backend Execution
- [ ] Implement `marduk-worker`:
  - Worker lifecycle state machine (`Starting`, `Healthy`, `Busy`, `Degraded`, `Stopped`).
  - Inference worker protocol supporting requests, token streaming, cancellation, and heartbeat telemetry.
  - Worker backend adapters:
    - In-process / HTTP inference adapter (supporting mistral.rs / Candle inference protocols).
    - Lightweight embedded inference engine for instant execution and deterministic testing.
  - Worker supervisor: monitors process health, handles automatic restart upon failure, enforces GPU device affinity.
- [ ] Integration:
  - Connect worker streams to Axum SSE (`/v1/chat/completions`).
  - Streaming token delivery with OpenAI-compatible chunks (`data: {"choices":[{"delta":{"content":"..."}}]}`).
- [ ] Verification: Unit tests for worker state transitions, crash recovery, and streaming token delivery.

---

## Phase 3: Scheduler and Resource Manager
- [ ] Implement `marduk-scheduler`:
  - Hard constraint filtering (health, model residency, queue capacity, VRAM headroom).
  - Multi-factor scoring function (queue wait estimation, execution duration, memory pressure, reload penalty).
  - Explainability logger: records exact decision rationales and candidate scores.
  - Bounded queue admission control: returns HTTP 429 / 503 on capacity saturation.
  - Client disconnection cancellation handling.
- [ ] Endpoints:
  - `/api/v1/scheduler/decisions`: query recent routing decisions and full rationales.
  - `/api/v1/workers`: inspect worker states, queue lengths, and device assignments.
- [ ] Verification: Multi-worker load test verifying routing balance and overload backpressure.

---

## Phase 4: Observability Dashboard
- [ ] Create modern, responsive frontend in `dashboard/`:
  - Built with React, TypeScript, and Vite.
  - Real-time connection to MARDUK API endpoints.
  - Core views:
    1. Overview: System health, active workers, active models, RPS, TPS, latency gauges.
    2. GPU Monitoring: Live VRAM usage bars, compute utilization %, thermals, power.
    3. Worker Management: Worker cards with status badges, queue depths, device mappings.
    4. Model Management: Registered models, parameters, memory requirements.
    5. Scheduler: Live feed of routing decisions with explainability tooltips.
    6. Performance & Latency: Historical charts and distribution histograms.
    7. Diagnostics & Logs: Structured event log viewer.
  - Honest empty states when no GPUs/workers are attached.
- [ ] Embed or serve dashboard through MARDUK API server.

---

## Phase 5: Performance Optimization & Benchmarking
- [ ] Implement `marduk-bench`:
  - Concurrent request generator.
  - Metrics collected: RPS, TPS, TTFT (Time to First Token), ITL (Inter-Token Latency), End-to-End latency, P50/P95/P99, GPU memory delta, routing overhead.
  - Comparison mode: Round-robin routing vs. MARDUK resource-aware routing.
  - Export reports to JSON and Markdown.
- [ ] Profile and eliminate allocations in hot request dispatch paths.

---

## Phase 6: Learned Scheduling (Burn Deep Learning)
- [ ] Implement `marduk-learned`:
  - Execution trace recorder (features: prompt length, max tokens, queue depth, VRAM usage, target GPU compute %).
  - Burn Multi-Layer Perceptron (MLP) model for latency & memory regression.
  - Training pipeline with loss evaluation, gradient descent, validation split, and checkpointing.
  - Shadow-mode evaluator comparing learned recommendations against deterministic baseline.

---

## Phase 7: Verification and Delivery
- [ ] Full workspace `cargo fmt --check`.
- [ ] Full workspace `cargo check`.
- [ ] Full workspace `cargo clippy --all-targets --all-features -- -D warnings`.
- [ ] Complete test suite execution (`cargo test --all`).
- [ ] Live end-to-end verification of GPU discovery, inference streaming, and dashboard API.
- [ ] Final Engineering Report compilation.
