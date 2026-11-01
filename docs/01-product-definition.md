# 1. MARDUK Product Definition

## One-line definition

**MARDUK measures and explains the real performance of your computer's CPU, GPU, memory and AI inference workloads.**

## Product promise

Know what your machine can do, understand how it is performing, and compare repeatable benchmark runs without trusting synthetic dashboard numbers or unexplained scores.

## Product surfaces

### Public website

The website is the product's public front door. It explains the product, publishes compatibility information, hosts documentation and links to verified desktop installers. It does not run hardware stress tests in the browser.

### Desktop application

The installed application performs hardware discovery, local benchmark execution, monitoring, rating calculations and local result history. It remains useful without a supported GPU and must support CPU-only systems as a first-class experience.

## Target users

1. PC and laptop owners who want an understandable picture of their system's performance.
2. Developers who need repeatable CPU, GPU, memory and inference measurements.
3. AI/ML practitioners comparing local inference backends, models and quantization configurations.
4. Workstation owners who need to verify changes after driver, OS, hardware or configuration updates.
5. Apple Silicon users who want accurate unified-memory and Metal-aware measurements rather than misleading dedicated-VRAM labels.

## Primary jobs to be done

- Discover what compute hardware and supported backends are actually available.
- Run a short, bounded benchmark without changing hardware settings.
- Understand raw results and how they were measured.
- Identify whether performance is limited by compute, memory, thermals, power policy or model/runtime configuration where observable.
- Compare repeat runs on the same machine and compare with compatible reference records when available.
- Run actual local AI inference using an installed or explicitly downloaded model.

## Product principles

- Local-first: benchmark data stays on the machine by default.
- Evidence over spectacle: measured values, method and uncertainty are visible.
- Capability-aware: unavailable sensors and unsupported backends are explicitly labelled.
- Safe by design: short bounded workloads, resource budgets, cancellation and conservative defaults.
- Comparable, not misleading: compare like-for-like hardware, backend, precision, workload and benchmark version.
- CPU is first-class: no-GPU laptops receive a complete product experience and CPU rating.
- No fake telemetry: no fabricated GPU cards, successful inference, benchmark history or scores.

## Version 1.0 scope

### Website

- Product homepage using the approved Petalyx-inspired visual direction already chosen by the owner.
- Product features, CPU/GPU platform compatibility, safety, FAQ and documentation pages/sections.
- Operating-system-aware download recommendation with manual platform selection.
- Download links only for actual published, verified release assets.

### Desktop application

- First-run device discovery.
- CPU benchmarks.
- GPU capability discovery and supported GPU benchmarks.
- System RAM and GPU/unified-memory measurements where technically valid.
- Hardware acceleration capability checks.
- Optional local AI inference benchmark.
- Short thermal/stability observation within available sensor support.
- CPU and GPU results shown separately.
- Local history and export.

## Explicit non-goals for v1.0

- No browser-based hardware stress testing.
- No overclocking, undervolting, voltage, fan or power-limit controls.
- No deliberate thermal throttling or hardware damage tests.
- No automatic model downloads.
- No cloud account requirement.
- No uploading machine telemetry by default.
- No universal single score pretending CPU-only and discrete GPU systems are directly equivalent.
- No claiming long-term reliability certification from a brief benchmark.
- No reinforcement-learning scheduler or agent framework unless a later product requirement justifies it.

## Product success measures

- A clean install launches without developer tooling.
- Hardware inventory correctly distinguishes detected, unsupported and unavailable capabilities.
- CPU-only devices can complete the full supported CPU benchmark suite.
- Supported GPU devices complete the relevant GPU tests on validated backends.
- Each benchmark result can be reproduced from its recorded configuration and version.
- Cancellation releases benchmark-owned resources safely.
- Website download buttons never point to missing or unverified binaries.
- Release notes and compatibility matrix reflect tested hardware, not theoretical backend capability.
