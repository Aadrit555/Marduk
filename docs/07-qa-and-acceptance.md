# 7. QA, Acceptance and Release Gates

## Repository audit

Before implementation, produce an inventory of every current crate, binary, frontend component, API endpoint, test, CI workflow and document. Mark each as implemented, partial, placeholder, broken or obsolete. Compare README claims with executable tests and runtime behavior.

The existing public README describes an inference-orchestration platform, while the agreed product is a cross-platform hardware benchmarking desktop app. Decide explicitly which old features are retained as optional local inference functionality and which are retired. Do not leave the product identity ambiguous.

## Build checks

Rust:
- `cargo fmt --check`
- `cargo check --workspace`
- `cargo clippy --workspace --all-targets --all-features -- -D warnings` (adjust only for known platform-specific feature issues and document them)
- `cargo test --workspace`

Frontend:
- TypeScript typecheck.
- Lint.
- Production build.
- Component/integration tests.

Desktop:
- Tauri build on each supported native runner.
- App launch smoke test.
- IPC validation.
- Local database creation/migration.
- Import/export and delete-history tests.

## Unit tests

- CPU feature detection and safe dispatch.
- Benchmark operation-count calculations.
- Memory allocation caps.
- GPU memory budget logic.
- Backend capability normalization.
- Cancellation state machine.
- Device concurrency lock.
- Rating normalization and reference matching.
- Persisted result schema migration.
- Release manifest schema validation.

## Hardware integration tests

CPU:
- Intel x86_64 where available.
- AMD x86_64 where available.
- Apple Silicon ARM64 where available.

GPU:
- NVIDIA CUDA on supported Windows/Linux target.
- Apple Metal on Apple Silicon.
- AMD ROCm only on validated Linux GPU/driver combinations.
- Other Vulkan/WGPU devices only if the actual kernel tests pass and the backend is labelled correctly.

For each hardware run, record actual device, OS, driver/backend, power condition, warmup, test duration and measurements. A mock adapter test is never a hardware integration test.

## Functional acceptance

- App installs and launches without a development server.
- App works offline for discovery and non-inference benchmarks.
- CPU-only machine receives useful tests and no fake GPU score.
- A supported GPU is discovered and only compatible tests are shown.
- Apple unified memory is labelled correctly.
- Unsupported telemetry shows `Unavailable`, not zero.
- Each benchmark has preflight, progress, cancellation and a final result/failure state.
- Running a test does not silently change voltage, clocks, fans, power plan or power limits.
- No model is downloaded without explicit confirmation.
- No inference success is fabricated.
- Results persist locally and can be exported/deleted.
- Website download links appear only for real published assets.

## Website acceptance

- Petalyx-inspired design direction and approved animated hero preserved.
- The five hero glass panels are category previews, not fake live telemetry.
- Website explains that tests run in the desktop app.
- Copy accurately describes Windows/macOS/Linux support based on validated release matrix.
- Download page has honest no-release state until installers exist.
- All links work; no dead buttons.
- Mobile responsive behavior passes.
- Accessibility and reduced-motion behavior pass.

## No-fabrication gate

The release is blocked if any of the following remain:
- Hardcoded live-looking benchmark values.
- Fake GPU telemetry.
- Fabricated inference output.
- Unsupported hardware presented as supported.
- Unverified performance comparison claims.
- Fake download buttons.
- Universal GPU rating generated without defensible baselines.

## Final report template

Report:
1. Implemented features.
2. Files added/changed/removed.
3. Platforms built.
4. Platforms actually tested.
5. Hardware used.
6. Tests and outcomes.
7. Benchmark raw results.
8. Scoring/reference coverage.
9. Installer assets and checksums.
10. Signing/notarization status.
11. Known limitations.
12. Features not yet implemented.
