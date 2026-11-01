# 2. MARDUK Website — Information Architecture and Finished Copy

## Website role

The website introduces MARDUK and distributes the desktop application. It must not imply that tests run in a browser. Preserve the approved Petalyx-inspired composition, scenic hero, existing animated glass panels and overall visual identity already established in the current site. The copy below replaces inference-orchestration marketing where it conflicts with the new product.

## Primary navigation

- Product
- Benchmarks
- Compatibility
- Safety
- Documentation
- Releases

Primary navigation CTA: **Download MARDUK**

Secondary CTA: **See how it works**

## Hero

Eyebrow: `CROSS-PLATFORM HARDWARE BENCHMARKING`

Title: `MARDUK`

Headline: **Know what your machine can really do.**

Body: `Measure CPU, GPU, memory and local AI inference performance with real workloads, hardware-aware tests and results you can understand.`

Primary CTA: **Download MARDUK**

Secondary CTA: **Explore the benchmarks**

Supporting note: `A desktop application for Windows, macOS and Linux. Hardware tests run locally—not in your browser.`

Do not display live-looking numerical telemetry in the decorative hero panels. The hero's five glass panels may preview the five benchmark categories, but must not show invented temperature, TFLOPS, GB/s, tokens/sec or readiness values. If decorative visual numbers are retained, mark them as illustrative in a way that cannot be mistaken for live measurements; preferably use category labels only.

## Hero glass-panel labels

1. `COMPUTE` — `CPU & GPU`
2. `MEMORY` — `RAM / VRAM`
3. `ACCELERATION` — `Supported hardware`
4. `AI INFERENCE` — `Local model tests`
5. `THERMAL` — `Sensor-aware monitoring`

These are visual previews, not active browser benchmarks.

## Intro section

Eyebrow: `MEASURE THE MACHINE YOU ACTUALLY HAVE`

Heading: **One toolkit. Your whole system.**

Body: `A laptop without a dedicated GPU still has a story worth measuring. A workstation with multiple accelerators deserves more than a generic score. MARDUK detects the hardware and supported execution paths on your computer, then runs the tests that genuinely apply.`

## Benchmark features

### 01 — Compute
Heading: `Measure raw compute.`

Copy: `Run repeatable CPU and supported GPU workloads. See single-thread and multi-thread CPU results alongside GPU throughput, with precision and workload details attached to every run.`

### 02 — Memory
Heading: `Understand memory performance.`

Copy: `Measure system-memory behavior and supported GPU-memory throughput. On Apple Silicon, MARDUK identifies unified memory correctly instead of inventing a separate VRAM figure.`

### 03 — Hardware acceleration
Heading: `Know which accelerators are actually available.`

Copy: `Discover supported instruction sets and GPU acceleration paths. MARDUK reports the backend and precision used, and does not label an operation as Tensor Core work unless that execution path is verified.`

### 04 — AI inference
Heading: `Benchmark real local inference.`

Copy: `Use a compatible model that you have installed or explicitly chosen to download. Measure time to first token, generation throughput and latency for that model, quantization and backend combination.`

### 05 — Thermal and stability observation
Heading: `Put results in context.`

Copy: `Observe temperature, power, clocks and throttling indicators where the operating system and hardware expose them. Short, bounded workloads help you understand behavior without turning the application into an uncontrolled burn-in tool.`

## Platform section

Eyebrow: `BUILT AROUND YOUR HARDWARE`

Heading: **Different machines. Honest measurements.**

Intro: `MARDUK adapts its tests to the hardware and drivers it can verify. The available benchmarks vary by device, operating system and installed backend.`

### Windows
Title: `Windows PCs and workstations`

Copy: `CPU tests are available on supported Windows systems. NVIDIA CUDA tests are available when a compatible GPU, driver and runtime are detected. Other GPU paths are shown only when validated on the device.`

### macOS
Title: `MacBook and Mac desktops`

Copy: `Apple Silicon systems are evaluated with CPU and supported Metal GPU workloads. MARDUK accounts for unified memory and does not report it as dedicated VRAM. Sensor availability varies by model and macOS version.`

### Linux
Title: `Linux systems`

Copy: `CPU tests work independently of GPU availability. GPU tests depend on the detected device, driver and supported compute backend, including compatible NVIDIA or AMD configurations.`

### CPU-only
Title: `No dedicated GPU? Still fully useful.`

Copy: `Run CPU compute, memory and supported vector benchmarks. If no compatible GPU backend is present, MARDUK explains what is unavailable and continues with the tests your machine can run.`

Do not label the entire platform "fully supported" until the specific release matrix has been validated on physical hardware.

## How it works

Heading: **From detection to a result you can trust.**

1. `Detect` — `MARDUK identifies your CPU, graphics devices, memory and supported backends.`
2. `Choose` — `Select a quick, standard or extended test profile. Review the resource budget before starting.`
3. `Measure` — `The desktop app runs bounded workloads locally and records real execution time and available telemetry.`
4. `Understand` — `Review raw metrics, methodology, hardware context and repeat-run history.`

## Safety section

Heading: **Benchmark with boundaries.**

Copy: `MARDUK uses bounded workloads, conservative memory budgets, cancellation and sensor-aware guardrails. It does not overclock, change voltage, adjust fan speeds or alter hardware power limits. Sensor access and safety enforcement vary by platform; no software can guarantee zero risk on every machine.`

Safety bullets:
- `Short default tests with explicit duration limits.`
- `Memory budgets that preserve system and GPU headroom.`
- `Sequential intensive tests by default.`
- `Battery and resource-pressure warnings where detectable.`
- `Clear reporting when sensor data is unavailable.`
- `Local results by default; no automatic upload of hardware telemetry.`

## Privacy section

Heading: **Your hardware data stays yours.**

Copy: `Benchmark runs and hardware details are stored locally by default. MARDUK does not require an account to run local tests. Any future diagnostic-sharing feature must be optional, clearly explained and disabled by default.`

Do not claim a privacy certification unless one has been independently obtained.

## Rating section

Heading: **Scores with context. Not mystery numbers.**

Copy: `MARDUK presents CPU, GPU and AI inference results separately. Scores are tied to a benchmark version, workload, precision and execution backend. When a trustworthy comparison baseline is not available, MARDUK shows the measured result instead of inventing a universal score.`

CTA: `Explore the rating methodology`

## Download section

Eyebrow: `GET MARDUK`

Heading: **Your next benchmark starts on your desktop.**

Body: `Choose the installer for your operating system. The desktop app performs hardware discovery and benchmarks locally.`

Buttons (only render when matching release assets exist):
- `Download for Windows`
- `Download for macOS`
- `Download for Linux`

Manual selector:
- `Windows x64`
- `macOS Apple Silicon`
- `macOS Intel` (only if built and validated)
- `Linux x86_64`
- `Linux ARM64` (only if built and validated)

Each release card must display:
- Version.
- Architecture.
- Package format.
- File size.
- SHA-256 checksum.
- Release date.
- Signing/notarization state where relevant.
- Minimum supported OS and known limitations.

If no release is published, show:

**`Desktop builds are not published yet.`**

`MARDUK is in active development. Installer downloads will appear here after each platform build has been tested and published.`

Do not create dead download links or point users to fictional installers.

## FAQ

### Does MARDUK run benchmarks in the browser?
`No. The website explains the product and distributes the installers. Hardware discovery and benchmark execution happen locally in MARDUK Desktop.`

### Can I use MARDUK without a dedicated GPU?
`Yes. CPU compute and system-memory tests are first-class features. GPU-only tests are shown as unavailable when no compatible device and backend are detected.`

### Does MARDUK support Apple Silicon?
`The application is designed to support Apple Silicon CPU and compatible Metal GPU workloads. Exact test availability depends on the MARDUK release and macOS/device support. Apple unified memory is identified separately from dedicated GPU memory.`

### Does MARDUK overclock my hardware?
`No. MARDUK does not change voltage, clock settings, fan speeds or hardware power limits.`

### Does it upload my benchmark results?
`Benchmark results are stored locally by default. Any optional diagnostic-sharing functionality must ask for explicit consent.`

### Why can two GPUs receive different scores in the same test?
`Results depend on the hardware, driver, backend, precision, workload size, power state and benchmark version. MARDUK records this context so comparisons are meaningful.`

### Does a high score guarantee gaming or AI performance in every application?
`No. A benchmark measures a defined workload. Real applications may behave differently depending on software, memory, drivers and workload characteristics.`

### Can I stop a benchmark?
`Yes. Running tests expose a cancellation control. MARDUK stops scheduling new work and releases benchmark resources safely after outstanding operations have completed.`

## Footer

Brand: `MARDUK`

Tagline: `Know what your machine can really do.`

Footer description: `Cross-platform CPU, GPU, memory and local AI inference benchmarking.`

Links:
- `Download`
- `Documentation`
- `Release notes`
- `Hardware support`
- `Benchmark methodology`
- `Privacy`
- `GitHub`

Copyright text should use the actual owner/organization and year. Do not invent a company name, address, affiliation or partner.

## Metadata

Title: `MARDUK — CPU, GPU & AI Benchmarking for Your Desktop`

Description: `Measure CPU, GPU, memory and local AI inference performance with MARDUK Desktop. Hardware-aware benchmarks for Windows, macOS and Linux.`

Open Graph title: `MARDUK — Know what your machine can really do.`

Open Graph description: `A local-first desktop toolkit for CPU, GPU, memory and AI inference benchmarking.`
