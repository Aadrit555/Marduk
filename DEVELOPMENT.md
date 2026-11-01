# MARDUK Development & Contribution Guide

This guide details the local setup, build commands, testing strategies, coding standards, and debugging workflows for developing MARDUK.

---

## 1. Environment Requirements

- **Rust**: Version 1.80+ (`rustup default stable`)
- **C++ Build Tools**: Visual Studio Build Tools 2022/2026 with C++ workload on Windows (`cl.exe`, `link.exe`), or GCC/Clang on Linux.
- **NVIDIA GPU**: Required for NVML telemetry and GPU-accelerated inference. (Fallback mode available for development without a GPU).
- **Node.js**: Version 18+ and npm 9+ for the web control center frontend.

---

## 2. Common Build Commands

### Compiling
```powershell
# Build entire workspace in debug mode
cargo build

# Build in release mode
cargo build --release

# Build specific crate
cargo build -p marduk-core
cargo build -p marduk-nvml
cargo build -p marduk-scheduler
cargo build -p marduk-worker
cargo build -p marduk-api
cargo build -p marduk-bench
cargo build -p marduk-cli
```

### Formatting & Linting
```powershell
# Format code
cargo fmt

# Check formatting without changes
cargo fmt --check

# Run Clippy with strict zero-warning rule
cargo clippy --all-targets --all-features -- -D warnings
```

### Testing
```powershell
# Run all workspace unit and integration tests
cargo test

# Run tests with output printing
cargo test -- --nocapture

# Run tests for a specific crate
cargo test -p marduk-scheduler
cargo test -p marduk-nvml
```

---

## 3. Running MARDUK Locally

### Launching the Server
```powershell
# Run with default configuration
cargo run -p marduk -- serve --host 127.0.0.1 --port 8080

# Run with custom config file and verbose logging
$env:RUST_LOG = "debug,marduk=trace"
cargo run -p marduk -- serve --config config/marduk.toml
```

### CLI Inspection Commands
```powershell
# Discover and inspect GPUs
cargo run -p marduk -- gpus

# Inspect active workers
cargo run -p marduk -- workers

# Run benchmark suite
cargo run -p marduk -- bench --concurrency 8 --requests 100
```

---

## 4. Frontend & Control Center Development

```powershell
cd frontend
npm install
npm run dev
```
The frontend dev server runs at `http://localhost:5173` with configurable proxy/base URL support to `http://localhost:8080`.

To build the static distribution for production:
```powershell
cd frontend
npm run build
```
Built assets will be placed in `frontend/dist`, which are automatically served by `marduk-api` at the root URL.

---

## 5. Code Quality Principles

1. **Explicit Error Types**: Use `thiserror` for library crates and `anyhow` only where high-level context wrapping in binary entrypoints is required. Never discard error origins.
2. **No Silent Defaults**: When a GPU metric is unavailable from NVML, represent it as `Option<T>::None` instead of substituting zero or synthetic data.
3. **No Unsafe Code Without Documentation**: Any `unsafe` block must have a preceding `// SAFETY:` comment proving why the invariants are maintained.
4. **Zero Panic in Hot Paths**: `unwrap()` and `expect()` are forbidden in production request handling paths. Use `?` operator or explicit pattern matching.
5. **Bounded Concurrency**: All message queues and async buffers must have static or configurable capacities to prevent unbounded memory growth under load.
