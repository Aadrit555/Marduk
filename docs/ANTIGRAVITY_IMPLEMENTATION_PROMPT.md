# ANTIGRAVITY MASTER TASK — TURN THE EXISTING MARDUK REPOSITORY INTO A DOWNLOADABLE PRODUCT

You are working in the existing repository: https://github.com/Aadrit555/Marduk

The product is MARDUK: a cross-platform desktop CPU/GPU/memory/AI-inference benchmarking application. Its public website introduces the product, explains compatibility and distributes verified desktop installers. The website does not execute hardware tests.

Read every document in `docs/` before changing code. Treat them as the product requirements and acceptance contract.

## Hard constraints

1. Audit the actual checkout before editing. Do not assume README claims are implemented.
2. Preserve and reuse valuable existing Rust and React code where it fits the new product.
3. Do not leave the product identity split between an old multi-GPU inference orchestration server and the new benchmarking app. Explicitly map retained, repurposed and retired features.
4. Preserve the approved Petalyx-inspired public website design, including the existing scenic hero and independently animated glass boxes. Do not redesign approved visual elements without permission.
5. The desktop application performs all real hardware discovery and benchmark execution locally through Rust.
6. Support CPU-only machines as a first-class product path.
7. Treat NVIDIA CUDA, Apple Metal, AMD ROCm and portable WGPU/Vulkan as separate capability-gated execution paths. Never claim a path works until it runs on target hardware.
8. Do not add Burn, CubeCL, CubeK, Candle, mistral.rs or other large dependencies unless a concrete feature needs them and their actual platform support has been validated. Burn is not required for basic benchmark kernels.
9. Never fabricate measurements, worker states, inference outputs, ratings, download assets or platform compatibility.
10. Keep hardware tests bounded, cancellable and conservative. Do not alter voltage, clocks, fans or power limits.
11. Keep code clean: no dead files, dead dependencies, giant modules, ignored errors, fake fallback data or undocumented unsafe blocks.
12. Verify builds and tests. Do not claim hardware support based solely on compilation or mocks.

## Phase 0 — Audit

Inventory the workspace, all crates, frontend components, APIs, docs, tests, scripts and CI. Mark each as working, partial, placeholder, broken or obsolete. Compare actual behavior with the README. Identify existing hardcoded or fabricated fallback telemetry and remove it from production paths. Fix stale directory references. Create an explicit migration plan.

## Phase 1 — Product foundation

Define shared versioned data types for hardware devices, capabilities, benchmarks, metrics, safety events and results. Establish typed error handling, structured logging and local storage schema. Keep CPU modules independent of GPU-specific libraries.

## Phase 2 — Desktop shell

Integrate Tauri 2 with the current React/TypeScript frontend if the audit confirms reuse is practical. Use narrow IPC commands, minimal Tauri permissions and no unrestricted shell access. The app must launch as an installed program without a manually started server. Retain the current visual identity and use desktop-specific screens for hardware and tests.

## Phase 3 — CPU vertical slice

Implement CPU discovery, safe runtime instruction detection, single/multi-thread compute, vector tests, system-memory tests, benchmark timing, cancellation, result persistence and export. Complete this vertical slice and test it on actual hardware before moving on.

## Phase 4 — GPU capability and first backend

Implement device discovery and capability reports. Choose the first GPU backend based on the existing code and validated target hardware, not marketing preference. Implement bounded compute and memory workloads. Record exact backend, precision, buffer sizes, synchronization and timings. Add NVIDIA telemetry as an optional capability, not a universal requirement.

## Phase 5 — Platform adapters

Add Apple Metal/Apple Silicon and supported AMD/Linux or other portable adapters only when validated on the correct hardware. Correctly label unified memory. Do not fabricate temperature or power data where platform sensors are unavailable.

## Phase 6 — Five benchmark experiences

Implement Compute, Memory, Hardware Acceleration, AI Inference and Thermal & Stability modules. Each must use only supported tests. AI inference requires an installed or explicitly downloaded real model. Safety monitoring is best-effort but must disclose sensor gaps and restrict tests where required.

## Phase 7 — Rating and history

Store results locally. Build transparent per-domain ratings only where a validated reference set exists. Otherwise show raw results and mark normalized ratings unavailable/provisional. Never create a misleading universal CPU/GPU rank.

## Phase 8 — Website content and downloads

Update the existing public website using the finished copy in `docs/02-website-content.md`. Preserve the approved Petalyx design and hero animation. Replace old inference-orchestration marketing where inconsistent. The five hero panels are visual category previews, not live telemetry. Add an OS-aware download selector, compatibility matrix, safety/privacy/FAQ content and release notes. Download links must be driven by a verified release manifest. Until installers exist, display the honest no-builds-yet state.

## Phase 9 — Native packaging

Use native CI runners to build Windows, macOS and Linux installers. Sign/notarize when credentials exist. Generate checksums, validate assets and publish a draft release for review. Only publish platforms actually built and tested.

## Phase 10 — Verification

Run Rust format/check/clippy/tests, frontend typecheck/build/tests and Tauri packaging tests. Run real CPU/GPU hardware tests where hardware exists. Test CPU-only behavior, cancellation, memory release, local persistence, offline mode, error states, mobile website layout, reduced motion and actual download links. Clearly report untested targets.

## Required completion output

Provide a report separating implemented, compiled but not hardware-tested, planned and unsupported features. List actual hardware and OS used, tests executed, real measurements, installer files/checksums, signing state and remaining limitations. Never invent successful output.

Start with Phase 0. Do not produce a decorative mockup and stop. Deliver a working, verifiable product in coherent increments.
