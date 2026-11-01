# 5. Benchmark Methodology and Safety

## General measurement rules

- Every result records benchmark version, device, OS, backend, precision, workload size, warmup, measurement duration and relevant configuration.
- Warmup is separate from measured iterations.
- Report raw samples or sufficient aggregates to calculate median and variability.
- Include P50/median and spread; do not rely on a single fastest sample.
- Identify thermal, battery and background-workload conditions when available.
- Never claim that one synthetic workload predicts every real application.
- Benchmark runs on the same device should be repeatable within documented tolerances, not perfectly identical.
- Users should be advised to close heavy workloads and keep laptops connected to power for standard/extended tests, without changing power policy automatically.

## CPU compute

Workloads:
- Integer arithmetic throughput.
- Floating-point arithmetic throughput.
- Matrix/vector arithmetic with defined operation counts.
- Single-thread and multi-thread variants.
- SIMD paths selected only after runtime feature detection.

Method:
- Scalar correctness reference.
- Explicit operation count.
- Warmup and bounded measurement interval.
- Thread counts recorded.
- Runtime CPU features recorded.
- Avoid accidentally measuring allocation, parsing or logging in the hot loop.

Reported units:
- Operations/s or GFLOP/s only when operation counting is valid.
- Wall-clock duration.
- Scaling efficiency for multi-thread tests where meaningful.

## CPU memory

Workloads:
- Sequential read.
- Sequential write.
- Copy.
- Working sets sized to distinguish cache-resident from larger memory-resident behavior where possible.

Record allocation size and access pattern. Do not label cache bandwidth as DRAM bandwidth if the working set fits in cache. Report the test as an effective measured rate and explain the method.

## GPU compute

Workloads:
- Bounded matrix multiplication or other well-defined compute kernels.
- Precision selected according to detected capability.
- Warmup and synchronized timing boundaries.
- Correctness comparison against a suitable reference.

Record exact backend and data type. GPU execution is asynchronous, so use backend-appropriate GPU timestamps or explicit synchronization around the measured interval. Do not calculate achieved TFLOPS using an incorrect operation count.

## GPU memory

Use bounded buffers and supported memory operations. Separate host-to-device transfer bandwidth from device-local memory bandwidth and peer-to-peer transfer bandwidth. Do not call a PCIe transfer test VRAM bandwidth. Record buffer size, transfer direction, pinned/pageable status and whether peer-to-peer was actually used.

## Unified memory

On Apple Silicon, report unified-memory information and the specific measured operation. Do not invent a dedicated VRAM capacity. Memory pressure is not the same thing as GPU memory utilization; label sensor data precisely.

## Hardware acceleration

Detect supported precision and acceleration paths. Verify the actual backend/kernel path when possible. Compare reduced-precision results with a higher-precision reference and record numerical error. Do not label generic floating-point work as Tensor Core work unless the implementation and hardware execution path justify that label.

## AI inference

Use a real model and inference backend. Record:
- Model identifier and exact revision/file metadata where possible.
- Quantization.
- Backend and device.
- Prompt token count.
- Output token count.
- Context length.
- Time to first token.
- Prompt processing time/rate if exposed.
- Decode throughput.
- Inter-token latency if measured.
- End-to-end time.
- Peak/steady memory if available.

Model downloads require explicit user confirmation, disk-space check, integrity check and license notice. No automatic download on first launch. Do not mix model-specific inference score with a universal GPU score.

## Thermal/stability observation

This is a short observation under controlled load, not a torture test or reliability certification. Use vendor/OS sensor data when accessible. If no trustworthy sensor is available, display that limitation and reduce or disable tests that require thermal guardrails.

## Safety controls

Recommended initial defaults (tunable only after hardware testing):
- Intensive tests run one at a time per device.
- CPU/GPU load measurement lasts about 5–10 seconds by default.
- Default maximum active measurement window: 15 seconds.
- Longer testing requires explicit opt-in and a separate safety explanation.
- Reserve system memory for OS/app operation; use configurable conservative allocation caps.
- Reserve GPU memory using both a percentage and absolute floor, then cap by current free memory and active worker reservations.
- Do not assume reported free memory can all be used safely.
- Abort if resource pressure exceeds configured limits.
- On battery, show a warning and use a conservative profile by default.
- No clock, voltage, fan or power-limit manipulation.
- No intentional thermal throttling or indefinite loops.
- Cancellation stops new work; already submitted GPU work is safely completed/synchronized before its buffers are released.

The app must not claim zero risk. Safety controls reduce risk, but device firmware, sensor access, background workloads and OS behavior vary.

## Rating methodology

Maintain separate domains:
- CPU compute.
- CPU memory.
- GPU compute.
- GPU memory.
- AI inference per model/backend configuration.

A rating can be published only when:
- The benchmark method is versioned.
- A reference set exists and its provenance is recorded.
- Hardware and workload comparisons are compatible.
- Outliers and run variability are handled transparently.

Do not produce a universal combined score that conceals CPU-only versus discrete-GPU differences. If reference coverage is incomplete, show raw measurements and label the score unavailable or provisional.

Never compare different precision, backend or model workloads without a clear qualification.
