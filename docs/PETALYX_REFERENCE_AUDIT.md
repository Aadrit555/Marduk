# Petalyx Visual Reference & Motion Design Audit

**Audit Date:** 2026-10-31  
**Target Reference:** https://motionsites.ai/?prompt=petalyx  
**Specification Source:** MotionSites AI Curated Prompt Library (id: `petalyx`, category: `Creative`, type: `hero`)  
**Design Persona & Theme:** Anime-watercolor cherry-blossom aesthetic, clean high-contrast typography, frosted glassmorphic elements, delicate motion curves, and precision physics-based scrolling.

---

## 1. Executive Summary

The Petalyx reference represents an ultra-high-craft landing and interactive product experience combining:
1. An atmospheric anime-watercolor natural landscape (cherry blossoms, misted river valley, drifting clouds, falling petals, and moonlit night scene).
2. A restrained, sophisticated color and typography system centered around high-contrast ink (`#121410`), earthy olive (`#4d6a10`), fresh green (`#6f9a0c`), lively lime (`#b4cd52`), soft herbal pill backgrounds (`#e7efcf`), crisp hairline borders (`#eef0ea`), and pure white cards (`#ffffff`).
3. Fluid, choreographed entrance animations: an intro zoom-out sequence where the viewport scales smoothly from 90% with 28px rounded corners to full width, while frosted glass tiles float and flicker.
4. Pinning and scroll-scrubbed metric ticker cards that rise over an animated Japanese cherry blossom tree.
5. An interactive 3-panel accordion featuring colossal numbered milestones (`01`, `02`, `03`) with clip-path transitions, drifting cloud overlays, and stateful hover/focus expansion.
6. A deep moonlit CTA section featuring 18 particle spans simulating falling cherry blossom petals (`fall` keyframes with variable rotations and drifts).
7. An animated SVG brand mark in the footer featuring bouncing dots merging into a continuous stroke and drawing circular rings.

---

## 2. Layout & Composition Architecture

### A. Viewport Breakpoints
- **Desktop (1440 × 900 and 1920 × 1080):**
  - Section heights are constrained to `100vh` / `min-height: 680px` with pinned scroll-triggered timeline sequences.
  - Floating pill navigation centered at `top: 22px`, width clamped to content with generous 44px interior spacing.
  - Hero media occupies the lower 72% of the viewport, masked smoothly into a white sky header via `mask-image: linear-gradient(to bottom, transparent 0, #000 22%)`.
  - Pinned Stats section arranges 4 ticket-cut cards horizontally in a 4-column grid (`min(880px, 100%)`).
  - Human-in-the-loop accordion spans 100% width with 3 vertical flex panels. Active panel flex-grows to fill available space (`flex-grow: 1`), while inactive panels compress to `clamp(96px, 11vw, 170px)`.
  - Moonlit CTA card floats centered at `top: 30%` (`width: min(680px, calc(100% - 32px))`) above an edge-to-edge 21:9 night valley panorama.
- **Mobile & Tablet (≤900px and ≤760px):**
  - Section pinning is disabled (`height: auto`, `min-height: 100vh`, padding adjusted to `90px 0 300px` for stats).
  - Cards collapse from a 4-column row into a 2-column or 1-column stack (`card height: 120px`).
  - Accordion transitions from a horizontal flex row into an elegant vertical step list with border dividers.
  - Hero headline re-anchors to `top: 26%`, hero video scales to 1.12 with adjusted focal center `object-position: 38% 100%`.
  - Floating clouds adjust to `width: 70vw` on left and `66vw` on right to maintain atmospheric depth without horizontal overflow.

---

## 3. Typography System

- **Primary Font Family:** `"Inter Tight"`, system-ui, -apple-system, BlinkMacSystemFont, sans-serif.
- **Weights Used:** 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold), + Italic 400/500 for emphasis.
- **Headline Scales:**
  - Hero Display Title (`h1#heroTitle`): `clamp(34px, 5.2vw, 76px)`, weight 400, letter-spacing `-0.045em`, line-height `1.04`.
  - Section Titles (`h2.h2`): `clamp(26px, 3.1vw, 44px)`, weight 400, letter-spacing `-0.03em`, line-height `1.12`.
  - Accordion Massive Numerals (`.num`): `clamp(170px, 36vh, 380px)`, weight 600, line-height `0.74`, letter-spacing `-0.07em`.
  - Card Metric Big Values (`.card b`): `clamp(30px, 3.4vw, 44px)`, weight 600, letter-spacing `-0.04em`, tabular numerals.
  - Section Pills (`.pill`): `11px`, weight 500, letter-spacing `0.01em`, uppercase/subtle tracking.
  - Body & Descriptions: `14px`, line-height `1.4`, color `#2b2e27` / `#1d2230`.

---

## 4. Visual Language & Tokens

| Token | CSS Variable | Hex / Value | Semantic Role in MARDUK |
|---|---|---|---|
| **Ink** | `--ink` | `#121410` | Primary text, high-contrast headings, terminal chrome text |
| **Olive** | `--olive` | `#4d6a10` | Primary interactive accents, primary buttons, active worker status |
| **Green** | `--green` | `#6f9a0c` | Intermediate state indicators, health status, cluster uptime badges |
| **Lime** | `--lime` | `#b4cd52` | Metric ticket cards, footer background, compute efficiency highlights |
| **Pill Background** | `--pill` | `#e7efcf` | Category tags, latency indicators, status badges (`color: #2c3a10`) |
| **Line / Divider** | `--line` | `#eef0ea` | Precision borders, accordion dividers, card strokes |
| **Canvas Background** | `--bg` | `#ffffff` | Clean container surfaces, elevated panels |
| **Outer Atmosphere** | `--stage` | `#e9eee0` | Viewport backdrop showing through zoom margins |
| **Corner Radius** | `--radius` | `22px` | Standard border radius for cards, tickets, and panels |

### Decorative & Glass Primitives
1. **Frosted Glass (`.glass`):**
   - Background: `rgba(255, 255, 255, 0.16)`
   - Border: `1px solid rgba(255, 255, 255, 0.55)`
   - Filter: `backdrop-filter: blur(10px) saturate(1.2)`
   - Inset highlight: `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4)`
2. **Ticket Notches (`.card`):**
   - Dual-sided radial masks creating realistic ticket punch-outs:
     `radial-gradient(circle 17px at 0 55%, #0000 97%, #000) left/51% 100% no-repeat, radial-gradient(circle 17px at 100% 55%, #0000 97%, #000) right/51% 100% no-repeat`
3. **Pill Buttons (`.btn`):**
   - Height: `36px`, border-radius: `999px`, background: `var(--olive)`, color: `#f3f8e4`.
   - Box shadow: `inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 2px 6px rgba(60, 80, 10, 0.25)`.
   - Hover: `translateY(-1px)`, background: `#5a7c14`.

---

## 5. Animation & Motion Design Inventory

| # | Element | Trigger | Starting State | Ending State | Duration / Easing | Stagger / Scrub |
|---|---|---|---|---|---|---|
| 1 | `#app` (Root Viewport) | Page Load (Intro) | `scale(0.9)`, `borderRadius: 28px` | `scale(1.0)`, `borderRadius: 0px` | 1.4s, `expo.inOut` | Delay: 0.25s |
| 2 | Navigation (`.nav`) | Page Load (Intro) | `y: -16px`, `opacity: 0` | `y: 0px`, `opacity: 1` | 0.8s, `power3.out` | Starts at `-=0.5s` |
| 3 | Hero Headline Words (`.w`) | Page Load (Intro) | `y: 24px`, `opacity: 0`, `blur(10px)` | `y: 0px`, `opacity: 1`, `blur(0px)` | 1.0s, `power3.out` | Stagger `0.07s` |
| 4 | Hero Clouds (`.cloud-l/r`) | Intro & Continuous | `x: -120px / +120px`, `opacity: 0` | `x: 0px`, `opacity: 1` then drift | 1.6s `power3.out` | Continuous drift: 14s/17s alternate |
| 5 | Hero Glass Tiles | Intro & Continuous | `scale(0.6)`, `opacity: 0` | `scale(1.0)`, `opacity: 0.16-0.8` | 0.6s `back.out(2)` | Stagger `0.05s` random; flicker 0.9s |
| 6 | Hero Parallax | Scroll `#hero` | `yPercent: 0` | Title: `yPercent: -60`, Media: `yPercent: 8` | Scrubbed 1:1 | Cloud data-par multiplier `* 2` |
| 7 | Stats Pinning & Scrub | Scroll `#stats` (Desktop) | Section pins at `top top` | Ticks scrub 0% → 100%, `#tree` yPercent 75% → 6% | Pinned `+=120%`, scrub 1.0 | Unpinned on mobile |
| 8 | Ticket Cards Reveal | Scroll into view | `y: 40px`, `opacity: 0` | `y: 0px`, `opacity: 1` | 0.8s `power3.out` | Stagger `0.08s` |
| 9 | Accordion Panels (`.panel`) | Hover / Focus / Click | `flex-grow: 0` (clipped number) | `flex-grow: 1` (expanded step details) | 0.9s `cubic-bezier(.77, 0, .18, 1)` | Inactive steps fade/blur `-24px` |
| 10 | CTA Night Panorama | Scroll `#cta` | `yPercent: -12` | `yPercent: 0` | Scrubbed across section | Starts at `top bottom` |
| 11 | Falling Petals | Continuous CSS | `translateY(-20px)`, `rotate(0deg)` | `translate(var(--dx), 110vh)`, `rotate(540deg)` | 9s–18s linear, infinite | Negative delay 0–15s across 18 items |
| 12 | CTA Card Reveal | Scroll `#cta top 60%` | `y: 80px`, `scale: 0.94`, `opacity: 0`, `blur(10px)` | `y: 0px`, `scale: 1.0`, `opacity: 1`, `blur(0px)` | 1.2s, `power3.out` | Smooth zoom-in reveal |
| 13 | Footer Logo Animation | Scroll `#footer top 92%` | 3 dots at cx 22/40/58 bounce `y: -8px` | Merge at cx 27 cy 50, mark draws (`dashoffset: 0`), ring draws | 0.25s dots, 0.6s mark, 0.9s ring | Coordinated timeline |
| 14 | Smooth Scrolling | User Wheel / Anchor | Raw jumps | Physics-eased kinetic scroll | 1.25s `t => Math.min(1, 1.001 - 2^(-10t))` | Powered by Lenis + GSAP ticker |

---

## 6. Official CloudFront Asset Registry

All media assets are validated and load with `HTTP/1.1 200 OK`:
- **Hero Valley Video:** `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093331_5998f443-1b9c-4b62-820c-8219c73c72c4.mp4`
- **Hero Poster / Backdrop:** `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093215_b7826239-e451-4e15-b42b-d6bcf9497a32.png`
- **Cloud A (Puffy Left):** `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093216_44218665-b15e-4566-a2d4-2676ab03609d.png`
- **Cloud B (Puffy Right):** `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093215_0f37c0c3-f82c-485b-87dd-5a35b75a8782.png`
- **Cherry Blossom Tree:** `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093215_95f11900-c4a0-49ad-bb2d-bb927dd594ee.png`
- **Moonlit 21:9 Night Valley:** `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093217_cc690198-ad8c-4127-8734-8485bd878351.png`

---

## 7. Adaptation Strategy for MARDUK

Rather than treating Petalyx as an unrelated art piece or merely copying generic marketing text, we translate each visual element into an authentic component of MARDUK's GPU orchestration narrative:

1. **The Hero Stage:** "MARDUK — INTELLIGENT GPU INFERENCE ORCHESTRATION — *Compute, coordinated.*" The gentle river valley video serves as the backdrop for fluid compute orchestration, with floating frosted glass panels acting as real-time GPU compute meters.
2. **The Ticket Stats Cards:** The 4 lime ticket cards display live cluster throughput, active GPUs, total dispatched requests, and average scheduling latency drawn directly from `/api/v1/metrics` and `/api/v1/gpus`.
3. **The 3-Panel Accordion:** Becomes MARDUK's three architectural pillars:
   - `01 — HARDWARE TELEMETRY`: Direct NVML kernel-level bindings, VRAM tracking, thermal and clock observability.
   - `02 — PREDICTIVE SCHEDULING`: Learned multi-factor dispatch, cache affinity, and cold-start minimization.
   - `03 — WORKER ISOLATION`: Sub-process fault containment, continuous batching, and dynamic model swapping.
4. **The Live Control Center:** Embedded into a pristine frosted glass interface styled with Petalyx design tokens, containing real hardware telemetry, worker supervisor tables, model management, scheduler decision feeds, an interactive benchmark suite, and an honest inference playground.
5. **The Falling Petal CTA & Footer:** Invites users to launch local workers, test inference via OpenAI-compatible endpoints, or inspect cluster diagnostics.

