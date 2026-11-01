# 3. MARDUK Desktop — Application Content and UX Copy

## Application identity

Application name: `MARDUK`

Window title: `MARDUK — Hardware Performance`

Tagline: `Know what your machine can really do.`

The desktop app should feel like a focused engineering utility: polished, clear, calm and data-rich. Reuse the MARDUK visual identity and approved visual language, but prioritize legibility and operational clarity over decorative motion.

## Main navigation

- Overview
- Hardware
- Benchmarks
- AI Inference
- History
- Settings

## First launch: discovery

Screen heading: `Let's identify your hardware.`

Description: `MARDUK is checking the processors, memory and supported compute backends available on this computer. This may take a moment.`

Progress labels:
- `Detecting CPU`
- `Inspecting memory`
- `Discovering graphics devices`
- `Checking compute backends`
- `Checking available sensors`

Complete state:

Heading: `Your system is ready to inspect.`

Body: `Review the detected hardware and choose the tests that apply to this machine. MARDUK will not run a benchmark until you start one.`

Buttons:
- `View hardware`
- `Run quick test`

## Overview

Heading: `System overview`

Subtitle: `A live view of detected hardware and your latest verified benchmark results.`

Cards:
- `Processor`
- `Graphics`
- `System memory`
- `Graphics memory` or `Unified memory` depending on device.
- `Available backends`
- `Last benchmark`

Status labels:
- `Detected`
- `Available`
- `Partially supported`
- `Unsupported`
- `Permission required`
- `Telemetry unavailable`
- `Not tested`
- `Result is stale`

Never display `Healthy` as a substitute for actual capability detection.

## Hardware screen

Heading: `Hardware inventory`

Sections:
- `CPU details`
- `Graphics devices`
- `Memory configuration`
- `Compute backends`
- `Sensor availability`

Use explanatory labels:
- `Dedicated VRAM` only for dedicated device memory.
- `Unified memory` for Apple Silicon and other unified-memory systems where applicable.
- `System RAM` for main memory.

If temperature is unavailable:

`Temperature telemetry is not exposed by this device or current driver.`

If power is unavailable:

`Power telemetry is unavailable for this hardware/backend combination.`

## Benchmarks screen

Heading: `Benchmark suite`

Subtitle: `Choose a test profile, review its resource budget and run measurements supported by your hardware.`

Profiles:

### Quick
`A short overview of supported compute and memory performance.`

### Standard
`A balanced set of compute, memory, acceleration and stability observations. AI inference is included only when a compatible model is already available or selected.`

### Extended
`Longer and more detailed measurements. Review the resource and power implications before continuing.`

Extended test confirmation:

Heading: `Review extended testing`

Body: `This profile runs longer workloads and may increase power use and device temperature. Save your work, connect power if appropriate, and confirm that you want to continue.`

Buttons:
- `Cancel`
- `I understand — continue`

## Five benchmark modules

### 01 — Compute

Description: `Measure CPU and supported GPU arithmetic throughput using defined, repeatable workloads.`

Metrics:
- `Single-thread score`
- `Multi-thread score`
- `Vector workload`
- `GPU throughput`
- `Precision`
- `Execution time`

Unavailable state: `No compatible GPU compute backend was detected. CPU compute tests remain available.`

### 02 — Memory

Description: `Measure data movement through system memory and supported graphics-memory paths.`

Metrics:
- `Read bandwidth`
- `Write bandwidth`
- `Copy bandwidth`
- `Working-set size`
- `Memory type`

### 03 — Acceleration

Description: `Check and measure hardware-accelerated operations supported by this device and backend.`

Metrics:
- `Detected capability`
- `Execution backend`
- `Data type / precision`
- `Measured throughput`
- `Numerical error`

Unavailable state: `This acceleration path is not available on the detected hardware or current driver.`

### 04 — AI Inference

Description: `Measure a real model running locally on the selected execution backend.`

Before running:
- `Model`
- `Quantization`
- `Execution backend`
- `Estimated memory requirement`
- `Maximum output tokens`

Model selection state: `No compatible model is currently available.`

Action: `Choose a model`

Model download confirmation: `This model requires a download of {size}. It will be stored locally at {path}. Continue?`

Metrics:
- `Model load time`
- `Time to first token`
- `Prompt processing rate`
- `Generation rate`
- `Inter-token latency`
- `Peak memory observed`

Never replace an inference error with example text.

### 05 — Thermal & Stability

Description: `Observe device behavior during a short, bounded workload. This is not a long-duration reliability certification.`

Metrics when supported:
- `Temperature`
- `Power`
- `Clock`
- `Utilization`
- `Throttling indicator`
- `Execution errors`

Unavailable state: `This system does not expose enough sensor information for the full thermal observation test. A reduced observation may be available.`

## Benchmark execution states

- `Ready`
- `Checking hardware`
- `Checking resource budget`
- `Preparing workload`
- `Warming up`
- `Measuring`
- `Finalizing results`
- `Completed`
- `Cancelled`
- `Failed`
- `Stopped by safety guard`

While running show:
- Test name.
- Device name.
- Execution backend.
- Elapsed time.
- Current stage.
- Current measurements only when actually sampled.
- Cancel button.

Cancellation acknowledgement:

`Stopping safely. MARDUK will release benchmark resources after submitted device work has completed.`

Safety abort:

Heading: `Benchmark stopped for safety.`

Body: `MARDUK detected a condition that exceeded this test's configured safety limits. No further benchmark work will be submitted. Review the recorded event before trying again.`

Failure:

`The benchmark could not complete. No score has been created. Review the diagnostic details below.`

## Results screen

Heading: `Benchmark results`

Summary labels:
- `CPU result`
- `GPU result`
- `Memory result`
- `AI inference result`
- `Run details`
- `Methodology`
- `Hardware context`

Actions:
- `Run again`
- `Compare runs`
- `Export report`
- `View raw measurements`

Comparison warning:

`These runs use different benchmark versions or execution configurations. Review the differences before comparing scores.`

No reference score:

`A reliable comparison baseline is not available for this configuration. Raw measurements are shown instead.`

## Rating labels

Use separate categories:
- `CPU performance`
- `GPU performance`
- `AI inference performance`
- `Memory performance`

Do not use one universal score to rank CPU-only machines against discrete GPUs.

Rating explanation:

`This score summarizes the selected benchmark suite and reference set. It is not a guarantee of performance in every application.`

Provisional rating:

`Provisional — a validated reference set is not yet available for this hardware and configuration.`

## History screen

Heading: `Your benchmark history`

Empty state:

`No completed benchmark runs yet. Start a test to build your local performance history.`

Filters:
- `All devices`
- `CPU`
- `GPU`
- `Memory`
- `AI inference`

## Settings

Sections:
- `Benchmark duration`
- `Memory reserve`
- `CPU thread limit`
- `Battery behavior`
- `Thermal safety`
- `Model storage`
- `Local data`
- `Updates`
- `Privacy`

Default privacy statement:

`Benchmark results stay on this computer. MARDUK does not upload hardware telemetry by default.`

Delete history confirmation:

`Delete all locally saved benchmark results? This cannot be undone.`

## CPU-only experience

No GPU detected heading:

`No supported GPU backend detected.`

Body:

`That's okay. MARDUK can still measure CPU compute, vector performance and system memory. GPU-only tests will remain unavailable until a compatible device and backend are detected.`

Do not make this state feel like an error or degraded product.

## Apple Silicon experience

Hardware label: `Apple GPU`

Memory label: `Unified memory`

Explanation:

`CPU and GPU share a unified memory system on this device. MARDUK reports unified-memory information separately from dedicated graphics memory.`

## Error copy

No permission:

`MARDUK could not access this hardware information. Review the required system permissions or driver installation.`

Driver/backend missing:

`The device was detected, but no compatible compute backend is available. Review the hardware support guide.`

Insufficient memory:

`This test was not started because the available memory budget is below the required safety reserve.`

Device busy:

`Another benchmark or workload is using this device. Wait for it to finish or choose an available device.`

Application update:

`A verified update is available. Review the release notes before installing.`
