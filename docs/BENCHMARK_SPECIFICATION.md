# MARDUK Desktop — Benchmark Workload Specifications & Rating Engine

## 1. Mathematical Principles & Scoring Axioms

All performance benchmarks in MARDUK Desktop adhere to the following empirical axioms:
1. **Physical Computation Only**: No synthetic delays, random number generation masquerading as computation, or simulated sleep timers.
2. **Deterministic Operations**: Floating-point and integer operations are mathematically defined and verifiable for numerical stability.
3. **Reproducibility**: Under identical thermal and power conditions, benchmark results should have a coefficient of variation ($CV = \frac{\sigma}{\mu}$) of less than $3\%$.

---

## 2. Module 01: Compute Core

### 2.1. Workload Description
Measures peak sustained arithmetic throughput using blocked General Matrix Multiply (GEMM) algorithms designed to saturate execution units without encountering memory bandwidth bottlenecks.

### 2.2. Mathematical Formulation
For square matrices $A \in \mathbb{R}^{N \times N}$ and $B \in \mathbb{R}^{N \times N}$, compute:
$$C = \alpha (A \cdot B) + \beta C$$
In standard GEMM, each element of the product requires $N$ multiplications and $N$ additions (or $N$ Fused Multiply-Adds).
The total floating-point operations performed per matrix multiplication of dimension $N$ is:
$$\text{FLOPs}_{\text{iter}} = 2 \times N^3$$
For a benchmark run executing $K$ iterations over duration $\Delta t$ seconds:
$$\text{Total FLOPs} = 2 \times N^3 \times K$$
$$\text{Achieved TFLOPS} = \frac{\text{Total FLOPs}}{\Delta t \times 10^{12}}$$

### 2.3. Numerical Precision & Verification
Before accepting a run as valid, the resulting matrix $C$ is checked against a known algebraic invariant:
$$\epsilon = \frac{\| C_{\text{computed}} - C_{\text{reference}} \|_F}{\| C_{\text{reference}} \|_F} < 10^{-4}$$
If the relative Frobenius norm error exceeds this bound, the benchmark reports a numerical precision fault.

### 2.4. CPU Implementation (Fallback / Primary CPU Mode)
- **Tiled Multi-Threaded Execution**: Matrix tiles of size $64 \times 64$ are scheduled across all logical threads using Rayon.
- **SIMD Intrinsics**: Inner loops utilize 256-bit AVX2+FMA3 instructions or 128-bit ARM NEON vector instructions, processing 8 FP32 elements per instruction cycle per physical core.

---

## 3. Module 02: Memory Subsystem Performance

### 3.1. Workload Description
Evaluates the sustained data transfer bandwidth of the dedicated VRAM (for discrete GPUs) or unified system memory (for CPUs and Apple Silicon).

### 3.2. Mathematical Formulation
Executes standard high-throughput memory streaming kernels over a memory buffer of size $S_{\text{bytes}}$ within safe allocation limits:
1. **Copy**: $c[i] = a[i]$ (1 Read, 1 Write $\implies 2 \times S_{\text{bytes}}$ transferred)
2. **Scale**: $b[i] = q \times a[i]$ (1 Read, 1 Write $\implies 2 \times S_{\text{bytes}}$ transferred)
3. **Add**: $c[i] = a[i] + b[i]$ (2 Reads, 1 Write $\implies 3 \times S_{\text{bytes}}$ transferred)
4. **Triad**: $a[i] = b[i] + q \times c[i]$ (2 Reads, 1 Write $\implies 3 \times S_{\text{bytes}}$ transferred)

For $M$ iterations transferring $B_{\text{total}}$ bytes across measured duration $\Delta t$:
$$\text{Bandwidth (GB/s)} = \frac{B_{\text{total}}}{\Delta t \times 10^9}$$

### 3.3. Cache-Bypassing Guarantees
To prevent artificially inflated scores from CPU L3 or GPU L2 cache hits, the memory allocation buffer size $S_{\text{bytes}}$ is dynamically configured to be at least $4\times$ the maximum hardware cache capacity (typically $\ge 256 \text{ MiB}$ up to safe allocation limits).

---

## 4. Module 03: Hardware Acceleration & Matrix Cores

### 4.1. Workload Description
Evaluates specialized matrix hardware (NVIDIA Tensor Cores, AMD Matrix Core, Apple AMX/MPS, or CPU AVX-512/AMX) using mixed-precision arithmetic.

### 4.2. Mathematical Formulation
- **Operand Precision**: Inputs $A$ and $B$ are stored in 16-bit half-precision floating point (`FP16` or `BF16`).
- **Accumulation**: Matrix products are accumulated into 32-bit single-precision floating point (`FP32`) to maintain dynamic range.
$$\text{Tensor TFLOPS} = \frac{2 \times N^3 \times K}{\Delta t \times 10^{12}}$$
$$\text{Speedup vs Scalar FP32} = \frac{\text{TFLOPS}_{\text{Tensor}}}{\text{TFLOPS}_{\text{FP32}}}$$

### 4.3. Validation Criteria
Mixed-precision calculations must preserve accuracy within an acceptable tolerance:
$$\epsilon_{\text{FP16}} = \frac{| \sum C_{ij} - \sum C^{\text{ref}}_{ij} |}{\sum |C^{\text{ref}}_{ij}|} < 10^{-2}$$

---

## 5. Module 04: AI Inference Engine

### 5.1. Workload Description
Measures end-to-end token generation performance under realistic Large Language Model (LLM) serving conditions.

### 5.2. Metrics & Definitions
- **Time to First Token (TTFT)**: Measures prompt ingestion and prefill latency.
  $$\text{TTFT} = t_{\text{token}_1} - t_{\text{prompt\_submission}} \quad (\text{ms})$$
- **Tokens Per Second (TPS)**: Generation throughput during the autoregressive decoding phase:
  $$\text{TPS} = \frac{N_{\text{output\_tokens}} - 1}{t_{\text{completion}} - t_{\text{token}_1}} \quad (\text{tokens/sec})$$
- **Inter-Token Latency (ITL)**: The time interval between successive token emissions:
  $$\Delta t_{\text{token}_i} = t_{\text{token}_i} - t_{\text{token}_{i-1}}$$
  The distribution is reported across percentiles: $p50$, $p90$, $p95$, and $p99$.

---

## 6. Module 05: Thermal, Power & Stability

### 6.1. Workload Description
Sustained multi-stage stress test designed to determine thermal dissipation efficiency, power throttling behavior, and clock stability over durations of 15 to 60 seconds.

### 6.2. Mathematical Formulation
- **Temperature Delta**:
  $$\Delta T = T_{\text{peak}} - T_{\text{start}} \quad (°\text{C})$$
- **Clock Consistency Score**: Measures clock stability under thermal load:
  $$\text{Clock Stability} = \max\left(0.0, \, 1.0 - \frac{\sigma(f_{\text{clock}})}{\mu(f_{\text{clock}})}\right) \times 100\%$$
- **Composite Stability Score**:
  $$\text{Stability Score} = 0.50 \times \text{Clock Stability} + 0.30 \times \left(1.0 - \frac{\Delta T}{50.0}\right) \times 100 + 0.20 \times \text{Throttle Penalty}$$
  Where Throttle Penalty is $100\%$ if no thermal/power throttling flags were triggered, and decremented by $25\%$ for each detected hardware throttling event.

---

## 7. Performance Rating Engine (The MARDUK Scores)

To provide clear, intuitive, and deterministic comparisons, MARDUK computes two independent standardized scores:

### 7.1. MARDUK GPU Score
Calibrated against a reference baseline (NVIDIA GeForce RTX 4090 = 10,000 points):
$$\text{Score}_{\text{GPU}} = \left( 0.40 \times \frac{\text{TFLOPS}_{\text{FP32}}}{82.6} + 0.30 \times \frac{\text{Bandwidth}_{\text{GB/s}}}{1008.0} + 0.15 \times \frac{\text{TFLOPS}_{\text{Tensor}}}{330.0} + 0.15 \times \frac{\text{Stability}_{\%}}{100.0} \right) \times 10{,}000$$

### 7.2. MARDUK CPU Score
Calibrated against a reference baseline (AMD Ryzen 9 7950X / Intel Core i9-13900K = 10,000 points):
$$\text{Score}_{\text{CPU}} = \left( 0.30 \times \frac{\text{SingleCore}_{\text{GFLOPS}}}{120.0} + 0.40 \times \frac{\text{MultiCore}_{\text{GFLOPS}}}{1800.0} + 0.15 \times \frac{\text{SIMD}_{\text{Speedup}}}{4.0} + 0.15 \times \frac{\text{RAM}_{\text{GB/s}}}{80.0} \right) \times 10{,}000$$

### 7.3. Hardware Classification Tiers

| Tier | Name | Typical Hardware Profile | Typical Score Range |
|---|---|---|---|
| **Tier 1** | Ultra Enthusiast / Datacenter | RTX 4090, H100, RTX 6000 Ada, Apple M3 Ultra | $8{,}000 - 15{,}000+$ |
| **Tier 2** | High Performance | RTX 4080, RTX 3090, RX 7900 XTX, Apple M3 Max | $5{,}500 - 7{,}999$ |
| **Tier 3** | Balanced Workstation | RTX 4070, RTX 3070, RX 7800 XT, Apple M3 Pro | $3{,}500 - 5{,}499$ |
| **Tier 4** | Mainstream / Mobile | RTX 4060, RTX 3050 Laptop, Radeon 7600 | $1{,}800 - 3{,}499$ |
| **Tier 5** | Entry / Efficient | GTX 1650, Integrated Radeon 780M, Intel Iris Xe | $500 - 1{,}799$ |
| **CPU Profile** | High-Throughput Host | Multi-Core Zen 4 / Raptor Lake / Apple M-series | CPU Score: $2{,}000 - 10{,}000+$ |

