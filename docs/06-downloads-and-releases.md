# 6. Downloads, Packaging and Releases

## Website download rules

The website is a release distributor, not a file host for locally generated or unverified binaries.

Download buttons must be driven by an actual release manifest or verified release API response. The website must never show a button for a platform asset that does not exist.

Until the first tested release exists, show:

**Desktop builds are not published yet.**

MARDUK is in active development. Installer downloads will appear here after each platform build has been tested and published.

Do not point to guessed file names.

## Target packages

### Windows
- x86_64 installer, NSIS or MSI.
- ARM64 only if explicitly built and hardware-tested.
- Code signing before public distribution is strongly recommended.

### macOS
- Apple Silicon package.
- Intel package only if that target remains supported and tested.
- DMG distribution.
- Sign and notarize for normal distribution outside the Mac App Store. Do not claim notarization until Apple's verification completes.

### Linux
- AppImage and/or DEB for the first validated x86_64 release.
- RPM when tested and maintained.
- ARM64 only when built and tested.

Do not promise all formats in the website before the CI pipeline produces them.

## Release manifest

Each published release should have machine-readable metadata containing:
- Version.
- Release date.
- Channel (stable/prerelease).
- OS.
- Architecture.
- Package format.
- Asset URL.
- File size.
- SHA-256.
- Signature/check status.
- Minimum OS version.
- Validation status.
- Release notes URL.

The website reads this manifest from a trusted release source. Validate schema and URLs; do not accept arbitrary external asset URLs from user content.

## CI workflow

Use native operating-system runners for packaging and platform tests. A cross-compiled build is not the same as a verified installer on the target OS.

For every target:
1. Run formatting, lint and unit tests.
2. Build the desktop app.
3. Package installer.
4. Validate package metadata and checksum.
5. Run smoke tests on the target OS where possible.
6. Sign/notarize when credentials are available.
7. Upload assets to a draft release.
8. Publish only after human review of the release matrix.
9. Update website release metadata.

## Versioning

Use SemVer for application releases. Include benchmark methodology version separately from application version so a UI-only release does not silently invalidate benchmark comparisons.

## Checksums and integrity

Generate SHA-256 checksums after packaging. Publish them beside the installer. If signing is configured, verify signatures in CI before publishing. The app updater must verify trusted signatures and enforce a secure update policy.

## Website download states

- `Available` — published asset exists and validation checks pass.
- `Coming soon` — target is planned but no validated asset exists; do not make it a download button.
- `Prerelease` — only show through an explicit opt-in channel.
- `Unsupported` — not a target for the current release.

## Current known release constraint

The public repository page reviewed for this package showed no published GitHub Releases. The first set of download links must therefore remain unavailable until actual installers are built, tested and published.
