import React, {
  useId,
  useRef,
  useLayoutEffect,
  CSSProperties,
  ReactNode,
} from 'react';

export interface GlyphPortalProps {
  /** Main word to display in giant interactive glyph typography (e.g. "MARDUK") */
  word?: string;
  /** Initial letter to focus through */
  focusChar?: string;
  /** Whether letter selection by hover/click/keyboard is enabled */
  interactive?: boolean;
  /** Background layer sitting inside the portal (radial glow, gradient, canvas) */
  background?: ReactNode;
  /** Content rendered on the hero surface before entering the portal */
  front?: ReactNode;
  /** Content rendered inside/after the portal */
  children?: ReactNode;
  /** Scroll multiplier controlling depth transition (default: 2.4) */
  scrollLength?: number;
  /** Font family for the glyphs */
  fontFamily?: string;
  /** Font weight for the glyphs (default: 700 or 900) */
  fontWeight?: number;
  /** Whether to render crosshair annotation marks on the focal glyph */
  annotations?: boolean;
  /** Button label to jump directly inside */
  enterLabel?: string;
  /** Additional CSS class names */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
  /** Progress callback reporting scroll transition value [0.0 - 1.0] */
  onProgress?: (progress: number) => void;
}

interface InscribedInterior {
  x: number;
  y: number;
  radius: number;
  index: number;
}

interface GlyphBounds {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const clamp = (val: number, min = 0, max = 1): number => Math.min(max, Math.max(min, val));

const smooth = (a: number, b: number, x: number): number => {
  const h = clamp((x - a) / (b - a));
  return h * h * (3 - 2 * h);
};

const DEFAULT_FONT = '"Inter", "Arial Black", "Arial", sans-serif';

/**
 * Computes the maximum inscribed interior circle inside a letter glyph
 * using canvas 2D distance transform rasterization.
 */
function interior(
  ctx: CanvasRenderingContext2D,
  char: string,
  font: string
): { x: number; y: number; radius: number } | null {
  const canvas = ctx.canvas;
  ctx.font = font;
  const metrics = ctx.measureText(char);
  const pad = 8;
  const left = Math.ceil(metrics.actualBoundingBoxLeft || 0);
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent || 0);
  const right = Math.ceil(metrics.actualBoundingBoxRight || 0);
  const descent = Math.ceil(metrics.actualBoundingBoxDescent || 0);

  canvas.width = Math.max(1, left + right + pad * 2);
  canvas.height = Math.max(1, ascent + descent + pad * 2);

  ctx.font = font;
  ctx.fontKerning = 'none';
  ctx.fillText(char, pad + left, pad + ascent);

  const { width, height } = canvas;
  if (width === 0 || height === 0) return null;

  const data = ctx.getImageData(0, 0, width, height).data;
  const dp = new Uint16Array(width + 1);
  let maxVal = 0;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    let leftVal = 0;
    for (let x = 0; x < width; x++) {
      const topVal = dp[x + 1];
      const isInk = data[(y * width + x) * 4 + 3] > 245;
      dp[x + 1] = isInk ? Math.min(topVal, dp[x], leftVal) + 1 : 0;
      leftVal = dp[x + 1];
      if (dp[x + 1] > maxVal) {
        maxVal = dp[x + 1];
        maxX = x;
        maxY = y;
      }
    }
  }

  if (maxVal < 3) return null;

  return {
    x: (maxX + 1 - maxVal / 2 - pad - left) / 3,
    y: (maxY + 1 - maxVal / 2 - pad - ascent) / 3,
    radius: (maxVal / 2 - 1) / 3,
  };
}

/** Finds the scrollable ancestor element */
function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let parent = el?.parentElement; parent; parent = parent.parentElement) {
    if (
      /(auto|scroll|hidden)/.test(getComputedStyle(parent).overflowY) &&
      parent !== document.body &&
      parent !== document.documentElement
    ) {
      return parent;
    }
  }
  return null;
}

export const GlyphPortal: React.FC<GlyphPortalProps> = ({
  word = 'MARDUK',
  focusChar,
  interactive = true,
  background,
  front,
  children,
  scrollLength = 2.4,
  fontFamily = DEFAULT_FONT,
  fontWeight = 700,
  annotations = false,
  enterLabel = 'ENTER MARDUK',
  className,
  style,
  onProgress,
}) => {
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const sectionId = `gp-${reactId}`;
  const clipId = `${sectionId}-clip`;
  const containerRef = useRef<HTMLElement | null>(null);
  const progressCallbackRef = useRef(onProgress);

  useLayoutEffect(() => {
    progressCallbackRef.current = onProgress;
  }, [onProgress]);

  const normalizedWord = word.trim().normalize('NFC') || 'MARDUK';
  let charOffset = 0;
  const chars = Array.from(normalizedWord, (c) => {
    const idx = charOffset;
    charOffset += c.length;
    return { char: c, index: idx };
  });

  const parsedScrollLength = Number.isFinite(scrollLength) ? clamp(scrollLength, 1, 8) : 2.4;
  const parsedFontWeight = Number.isFinite(fontWeight) ? clamp(fontWeight, 100, 900) : 700;
  const scopeSelector = `:where(#${sectionId})`;

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const pin = root.querySelector<HTMLElement>('[data-gp-pin]');
    const field = root.querySelector<HTMLElement>('[data-gp-field]');
    const art = root.querySelector<SVGSVGElement>('[data-gp-art]');
    const clipTransform = root.querySelector<SVGElement>(`#${clipId}`);
    const glyphText = root.querySelector<SVGTextElement>('[data-gp-glyph]');
    const marksGroup = root.querySelector<SVGGElement>('[data-gp-marks]');
    const choices = root.querySelector<HTMLElement>('[data-gp-choices]');
    const buttons = choices ? Array.from(choices.querySelectorAll<HTMLButtonElement>('button')) : [];
    const selectEl = root.querySelector<HTMLSelectElement>('[data-gp-select]');
    const scroller = scrollParent(root);
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let isDestroyed = false;
    let animFrame = 0;
    let needsRelayout = true;
    let isIntersecting = true;
    let fontChecked = false;
    const startTime = performance.now();

    let hasScrolledOnce = false;
    let fontTimeoutTriggered = false;
    let clientWidth = 1;
    let clientHeight = 1;
    let scrollRange = 1;
    let baseScale = 1;
    let targetZoom = 1;
    let centerPt = { x: 0, y: 0 };
    let focusedInterior: InscribedInterior | null = null;
    let lastProgress = -1;
    let interiors: InscribedInterior[] = [];
    let glyphBounds: GlyphBounds[] = [];
    let canChoose = false;
    let wordBox = { x: 0, y: 0, width: 1, height: 1 };
    let initialLayoutDone = true;

    if (glyphText) {
      glyphText.style.fontFamily = fontFamily;
      const fontList =
        getComputedStyle(glyphText).fontFamily.match(/(?:[^,"']+|"[^"]*"|'[^']*')+/g) ?? [];
      const validFonts = fontList.filter((f) => {
        try {
          return document.fonts.check(`${parsedFontWeight} 100px ${f.trim()}`, normalizedWord);
        } catch {
          return false;
        }
      });
      glyphText.style.fontFamily = [...validFonts, DEFAULT_FONT].join(',');
      fontTimeoutTriggered = validFonts.length < fontList.length;
    }

    const readInk = () => {
      if (!ctx || !glyphText) return false;
      const compStyle = getComputedStyle(glyphText);
      const font300 = `${compStyle.fontWeight} 300px ${compStyle.fontFamily}`;
      ctx.font = `${compStyle.fontWeight} 100px ${compStyle.fontFamily}`;
      ctx.fontKerning = 'none';

      const totalMetrics = ctx.measureText(normalizedWord);
      const xOffsets = Array.from(
        { length: normalizedWord.length },
        (_, idx) => ctx.measureText(normalizedWord.slice(0, idx)).width
      );

      wordBox = {
        x: -totalMetrics.actualBoundingBoxLeft,
        y: -totalMetrics.actualBoundingBoxAscent,
        width: totalMetrics.actualBoundingBoxLeft + totalMetrics.actualBoundingBoxRight,
        height: totalMetrics.actualBoundingBoxAscent + totalMetrics.actualBoundingBoxDescent,
      };

      if (!wordBox.width || !wordBox.height) return false;

      centerPt = {
        x: wordBox.x + wordBox.width / 2,
        y: wordBox.y + wordBox.height / 2,
      };

      const requestedCharIdx = focusChar ? normalizedWord.indexOf(focusChar.normalize('NFC')) : -1;
      let currIdx = 0;
      interiors = [];
      glyphBounds = [];

      for (const charStr of Array.from(normalizedWord)) {
        ctx.font = `${compStyle.fontWeight} 100px ${compStyle.fontFamily}`;
        const charMetrics = ctx.measureText(charStr);
        glyphBounds.push({
          index: currIdx,
          x: xOffsets[currIdx] - charMetrics.actualBoundingBoxLeft,
          y: -charMetrics.actualBoundingBoxAscent,
          width: charMetrics.actualBoundingBoxLeft + charMetrics.actualBoundingBoxRight,
          height: charMetrics.actualBoundingBoxAscent + charMetrics.actualBoundingBoxDescent,
        });

        const intCircle = interior(ctx, charStr, font300);
        if (intCircle) {
          interiors.push({
            ...intCircle,
            x: intCircle.x + xOffsets[currIdx],
            index: currIdx,
          });
        }
        currIdx += charStr.length;
      }

      focusedInterior =
        interiors.find((item) => item.index === requestedCharIdx) ??
        [...interiors].sort(
          (a, b) => b.radius - a.radius || Math.abs(a.x - centerPt.x) - Math.abs(b.x - centerPt.x)
        )[0] ??
        null;

      return true;
    };

    const selectGlyph = (target: InscribedInterior | null) => {
      focusedInterior = target;
      targetZoom = focusedInterior
        ? Math.max(baseScale, Math.hypot(clientWidth, clientHeight) / (focusedInterior.radius * 1.35))
        : baseScale;

      root.dataset.gpFocus = focusedInterior
        ? Array.from(normalizedWord.slice(focusedInterior.index))[0]
        : '';
      root.dataset.gpFocusIndex = String(focusedInterior?.index ?? -1);

      for (const btn of buttons) {
        const btnIndex = Number(btn.dataset.gpLetter);
        const isMatched = btnIndex === (focusedInterior?.index ?? -1);
        btn.disabled = !interiors.some((item) => item.index === btnIndex);
        btn.setAttribute('aria-checked', String(isMatched));
        btn.tabIndex = isMatched ? 0 : -1;
      }

      if (selectEl && selectEl.value !== '') {
        selectEl.value = String(focusedInterior?.index ?? -1);
        for (const opt of Array.from(selectEl.options)) {
          opt.disabled = opt.value === '' || !interiors.some((it) => it.index === Number(opt.value));
        }
      }

      if (marksGroup) {
        const invScale = 1 / baseScale;
        const lineY = wordBox.y + wordBox.height + 25 * invScale;
        const startX = wordBox.x;
        const endX = startX + wordBox.width;
        const focalCross = focusedInterior
          ? `M${focusedInterior.x - 9 * invScale} ${focusedInterior.y}h${18 * invScale}M${
              focusedInterior.x
            } ${focusedInterior.y - 9 * invScale}v${18 * invScale}`
          : '';

        const path = marksGroup.querySelector('path');
        if (path) {
          path.setAttribute(
            'd',
            `M${startX} ${lineY}H${endX}M${startX} ${lineY - 5 * invScale}v${10 * invScale}M${endX} ${
              lineY - 5 * invScale
            }v${10 * invScale}${focalCross}`
          );
          path.setAttribute('stroke-width', String(invScale));
        }
      }
    };

    const getScrollProgress = () => {
      const topOffset = scroller ? scroller.getBoundingClientRect().top + scroller.clientTop : 0;
      return clamp((topOffset - root.getBoundingClientRect().top) / scrollRange);
    };

    const paint = (progress: number) => {
      const isStatic = motionQuery.matches || !hasScrolledOnce || fontTimeoutTriggered || !focusedInterior;
      const effectiveProgress = isStatic ? 0 : progress;

      const normProgress = clamp(effectiveProgress / 0.78);
      const easeT =
        normProgress < 0.5
          ? 4 * normProgress ** 3
          : 1 - (-2 * normProgress + 2) ** 3 / 2;

      const currentScale = Math.exp(Math.log(baseScale) + Math.log(targetZoom / baseScale) * easeT);
      const lerpFactor = targetZoom === baseScale ? 0 : (1 / currentScale - 1 / baseScale) / (1 / targetZoom - 1 / baseScale);

      const targetX = focusedInterior?.x ?? centerPt.x;
      const targetY = focusedInterior?.y ?? centerPt.y;
      const camX = centerPt.x + (targetX - centerPt.x) * lerpFactor;
      const camY = centerPt.y + (targetY - centerPt.y) * lerpFactor;

      const tilt = -4 * smooth(0.06, 0.5, normProgress) * (1 - smooth(0.62, 0.92, normProgress));
      const rad = (tilt * Math.PI) / 180;
      const cx = clientWidth / 2 / currentScale;
      const cy = (clientHeight * 0.46 + clientHeight * 0.04 * easeT) / currentScale;

      if (clipTransform) {
        clipTransform.setAttribute('transform', `scale(${currentScale}) rotate(${tilt})`);
      }

      if (glyphText) {
        glyphText.setAttribute(
          'transform',
          `translate(${Math.cos(rad) * cx + Math.sin(rad) * cy - camX} ${
            -Math.sin(rad) * cx + Math.cos(rad) * cy - camY
          })`
        );
      }

      if (marksGroup) {
        marksGroup.setAttribute(
          'transform',
          `translate(${clientWidth / 2} ${clientHeight * 0.46 + clientHeight * 0.04 * easeT}) scale(${currentScale}) rotate(${tilt}) translate(${-camX} ${-camY})`
        );
        marksGroup.style.opacity = String(1 - smooth(0.015, 0.17, effectiveProgress));
      }

      canChoose = interactive && !isStatic && effectiveProgress < 0.04;
      if (choices) {
        (choices as any).inert = !canChoose;
      }
      root.dataset.gpChoosing = String(canChoose);

      if (field) {
        field.style.clipPath = normProgress >= 1 ? 'none' : `url(#${clipId})`;
      }

      root.style.setProperty('--gp-caption', String(1 - smooth(0.01, 0.16, effectiveProgress)));
      root.style.setProperty('--gp-reveal', String(isStatic ? 1 : smooth(0.42, 0.72, effectiveProgress)));
      root.style.setProperty('--gp-field-scale', String(1 + 0.16 * smooth(0, 0.82, effectiveProgress)));
      root.style.setProperty('--gp-caption-hit', effectiveProgress < 0.08 ? 'auto' : 'none');
      root.dataset.gpEntered = String(effectiveProgress >= 0.65);
      root.dataset.gpProgress = effectiveProgress.toFixed(5);

      if (effectiveProgress !== lastProgress) {
        lastProgress = effectiveProgress;
        progressCallbackRef.current?.(effectiveProgress);
      }
    };

    const layout = () => {
      if (!root.clientWidth || !pin || !art) return;
      clientWidth = pin.clientWidth;
      const viewportEl = root.querySelector<HTMLElement>('[data-gp-viewport]');
      const rawH = viewportEl?.offsetHeight || window.innerHeight;
      const effH = Math.max(1, Math.min(scroller?.clientHeight ?? rawH, rawH));

      clientHeight = motionQuery.matches ? Math.min(effH * 0.75, 480) : effH;
      root.style.setProperty('--gp-height', `${clientHeight}px`);
      scrollRange = clientHeight * parsedScrollLength;

      art.setAttribute('viewBox', `0 0 ${clientWidth} ${clientHeight}`);

      if (initialLayoutDone) {
        fontChecked = readInk();
        initialLayoutDone = false;
      }

      if (!fontChecked) return;

      const maxWordHeight = front && clientHeight < 480 ? Math.min(clientHeight * 0.38, Math.max(24, clientHeight - 264)) : clientHeight * 0.38;
      baseScale = Math.min((clientWidth * 0.84) / wordBox.width, maxWordHeight / wordBox.height);
      selectGlyph(focusedInterior);

      for (const btn of buttons) {
        const gb = glyphBounds.find((g) => g.index === Number(btn.dataset.gpLetter));
        if (gb) {
          Object.assign(btn.style, {
            left: `${clientWidth / 2 + (gb.x - centerPt.x) * baseScale}px`,
            top: `${clientHeight * 0.46 + (gb.y - centerPt.y) * baseScale - Math.max(0, 44 - gb.height * baseScale) / 2}px`,
            width: `${Math.max(1, gb.width * baseScale)}px`,
            height: `${Math.max(44, gb.height * baseScale)}px`,
          });
        }
      }

      root.style.setProperty('--gp-word-top', `${clientHeight * 0.46 - (wordBox.height * baseScale) / 2}px`);
      root.style.setProperty('--gp-word-bottom', `${clientHeight * 0.46 + (wordBox.height * baseScale) / 2}px`);
      root.dataset.gpReady = 'true';
      root.dataset.gpMotion = !motionQuery.matches && hasScrolledOnce && !fontTimeoutTriggered && focusedInterior ? 'on' : 'off';
    };

    const onFrame = (time?: number) => {
      animFrame = 0;
      if (!isDestroyed) {
        if (time !== undefined && !hasScrolledOnce) {
          hasScrolledOnce = true;
          if (!fontTimeoutTriggered) {
            fontTimeoutTriggered = performance.now() - startTime > 2500;
          }
          needsRelayout = true;
        }
        if (needsRelayout) {
          needsRelayout = false;
          layout();
        }
        if (fontChecked) {
          paint(getScrollProgress());
        }
      }
    };

    const schedule = () => {
      if (!animFrame && isIntersecting) {
        animFrame = requestAnimationFrame(onFrame);
      }
    };

    const onResize = () => {
      cancelAnimationFrame(animFrame);
      needsRelayout = true;
      onFrame();
    };

    const onScroll = () => schedule();

    const onChoose = (e: Event) => {
      if (!canChoose || getScrollProgress() >= 0.04) return;
      const targetBtn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-gp-letter]');
      const match = interiors.find((item) => item.index === Number(targetBtn?.dataset.gpLetter));
      if (match && match !== focusedInterior) {
        selectGlyph(match);
        paint(getScrollProgress());
      }
    };

    const onNavigate = (e: KeyboardEvent) => {
      if (!canChoose || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const currIdx = interiors.indexOf(focusedInterior!);
      const nextIdx =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
          ? interiors.length - 1
          : (currIdx + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + interiors.length) % interiors.length;

      const btn = buttons.find((b) => Number(b.dataset.gpLetter) === interiors[nextIdx]?.index);
      btn?.focus({ preventScroll: true });
    };

    const onSelectChange = () => {
      if (!canChoose || getScrollProgress() >= 0.04 || !selectEl) return;
      const match = interiors.find((item) => item.index === Number(selectEl.value));
      if (match) {
        selectGlyph(match);
        paint(getScrollProgress());
      }
    };

    if (choices) {
      choices.addEventListener('pointerover', onChoose);
      choices.addEventListener('click', onChoose);
      choices.addEventListener('focusin', onChoose);
      choices.addEventListener('keydown', onNavigate as any);
    }

    if (selectEl) {
      selectEl.addEventListener('change', onSelectChange);
    }

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(root);
    if (scroller) resizeObserver.observe(scroller);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        if (isIntersecting) {
          needsRelayout = true;
          schedule();
        } else if (animFrame) {
          cancelAnimationFrame(animFrame);
          animFrame = 0;
        }
      },
      { root: scroller, rootMargin: '100% 0px' }
    );
    intersectionObserver.observe(root);

    const scrollTarget = scroller ?? window;
    scrollTarget.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    motionQuery.addEventListener('change', onResize);

    onFrame();
    schedule();

    return () => {
      isDestroyed = true;
      cancelAnimationFrame(animFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      scrollTarget.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      motionQuery.removeEventListener('change', onResize);

      if (choices) {
        choices.removeEventListener('pointerover', onChoose);
        choices.removeEventListener('click', onChoose);
        choices.removeEventListener('focusin', onChoose);
        choices.removeEventListener('keydown', onNavigate as any);
      }
      if (selectEl) {
        selectEl.removeEventListener('change', onSelectChange);
      }
    };
  }, [normalizedWord, focusChar, interactive, fontFamily, parsedFontWeight, parsedScrollLength, clipId, front]);

  return (
    <section
      ref={containerRef}
      id={sectionId}
      className={className}
      aria-label={normalizedWord}
      style={{
        ['--gp-length' as any]: parsedScrollLength,
        ['--gp-characters' as any]: Array.from(normalizedWord).length,
        ...style,
      }}
    >
      <style>{`
        ${scopeSelector} {
          --gp-paper: #060911;
          --gp-ink: #f8fafc;
          --gp-field: #0a0e1a;
          --gp-foreground: #f8fafc;
          position: relative;
          isolation: isolate;
          background: var(--gp-paper);
          color: var(--gp-ink);
          font-family: inherit;
        }
        ${scopeSelector} > [data-gp-viewport] {
          position: absolute;
          inset: 0 auto auto 0;
          height: 100vh;
          height: 100svh;
          width: 0;
          pointer-events: none;
          visibility: hidden;
        }
        ${scopeSelector} [data-gp-pin] {
          position: relative;
          height: var(--gp-height, 100svh);
          overflow: clip;
          isolation: isolate;
          container-type: size;
        }
        ${scopeSelector} [data-gp-field] {
          position: absolute;
          inset: 0;
          background: var(--gp-field);
          opacity: 0;
          pointer-events: none;
        }
        ${scopeSelector}[data-gp-ready] [data-gp-field] {
          opacity: 1;
        }
        ${scopeSelector} [data-gp-art] {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
        }
        ${scopeSelector} [data-gp-marks] {
          fill: none;
          stroke: #8b5cf6;
          opacity: 0.6;
        }
        ${scopeSelector} [data-gp-choices] {
          position: absolute;
          inset: 0;
          visibility: hidden;
          pointer-events: none;
        }
        ${scopeSelector}[data-gp-choosing=true] [data-gp-choices] {
          visibility: visible;
        }
        ${scopeSelector} [data-gp-letter] {
          box-sizing: border-box;
          position: absolute;
          border: 0;
          padding: 0;
          margin: 0;
          background: transparent;
          cursor: pointer;
          pointer-events: auto;
          touch-action: pan-y;
          border-radius: 6px;
          transition: background-color 0.15s ease;
        }
        ${scopeSelector} [data-gp-letter]:hover {
          background-color: rgba(139, 92, 246, 0.12);
        }
        ${scopeSelector} [data-gp-letter]:disabled {
          pointer-events: none;
        }
        ${scopeSelector} [data-gp-letter]:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 4px;
        }
        ${scopeSelector} [data-gp-touch-picker] {
          display: none;
          position: absolute;
          top: calc(var(--gp-word-bottom, 50%) + 42px);
          left: 50%;
          transform: translateX(-50%);
          font: 12px/1.4 'JetBrains Mono', monospace;
          align-items: center;
          gap: 12px;
          visibility: hidden;
        }
        ${scopeSelector}[data-gp-choosing=true] [data-gp-touch-picker] {
          visibility: visible;
        }
        ${scopeSelector} [data-gp-select] {
          min-height: 44px;
          min-width: 90px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          background: #0f172a;
          color: #f8fafc;
          padding: 0 10px;
          font: inherit;
        }
        ${scopeSelector} [data-gp-select]:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 4px;
        }
        @media (any-pointer: coarse) {
          ${scopeSelector} [data-gp-touch-picker] {
            display: flex;
          }
        }
        ${scopeSelector} [data-gp-fallback] {
          position: absolute;
          inset: 0;
          display: none;
          place-items: center;
          font-size: min(calc(100cqw / var(--gp-characters)), 38cqh);
          line-height: 1;
          color: var(--gp-field);
        }
        ${scopeSelector}[data-gp-ready] [data-gp-fallback] {
          visibility: hidden;
        }
        ${scopeSelector} [data-gp-caption] {
          position: absolute;
          inset: auto 8% 9%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          font: 12px/1.4 'JetBrains Mono', monospace;
          opacity: var(--gp-caption, 1);
          pointer-events: var(--gp-caption-hit, auto);
          font-family: inherit;
        }
        ${scopeSelector} [data-gp-front] {
          position: absolute;
          inset: 0;
          opacity: var(--gp-caption, 1);
          pointer-events: none;
        }
        ${scopeSelector} [data-gp-front] a,
        ${scopeSelector} [data-gp-front] button {
          pointer-events: var(--gp-caption-hit, auto);
        }
        ${scopeSelector} [data-gp-front]:focus-within {
          opacity: 1;
        }
        ${scopeSelector} [data-gp-hint] {
          max-width: 30ch;
          color: #94a3b8;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        ${scopeSelector} [data-gp-enter] {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          min-height: 44px;
          padding: 0 20px;
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.4);
          border-radius: 10px;
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.2);
          transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
        }
        ${scopeSelector} [data-gp-enter]:hover {
          background: rgba(139, 92, 246, 0.35);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.35);
        }
        ${scopeSelector} [data-gp-enter]:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 4px;
        }
        ${scopeSelector} [data-gp-content] {
          box-sizing: border-box;
          position: relative;
          min-height: var(--gp-height, 100svh);
          padding: clamp(32px, 7%, 100px);
          display: grid;
          align-content: center;
          color: var(--gp-foreground);
          background: var(--gp-field);
          overflow-wrap: anywhere;
        }
        ${scopeSelector}[data-gp-motion=on] [data-gp-pin] {
          position: sticky;
          top: 0;
        }
        ${scopeSelector}[data-gp-motion=off] [data-gp-hint] {
          display: none;
        }
        ${scopeSelector}[data-gp-motion=on] [data-gp-content] {
          margin-top: calc((var(--gp-length) - 1) * var(--gp-height));
          background: transparent;
          opacity: var(--gp-reveal, 0);
          pointer-events: none;
        }
        ${scopeSelector}[data-gp-motion=on][data-gp-entered=true] [data-gp-content] {
          pointer-events: auto;
        }
        ${scopeSelector}[data-gp-motion=on]:has([data-gp-content]:focus-within) [data-gp-field] {
          clip-path: none !important;
        }
        ${scopeSelector}[data-gp-motion=on] [data-gp-content]:focus-within {
          opacity: 1;
          pointer-events: auto;
        }
        ${scopeSelector}:has([data-gp-content]:focus-within) [data-gp-caption],
        ${scopeSelector}:has([data-gp-content]:focus-within) [data-gp-marks] {
          opacity: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          ${scopeSelector} [data-gp-pin] {
            position: relative !important;
          }
          ${scopeSelector} [data-gp-content] {
            margin-top: 0 !important;
            opacity: 1 !important;
            background: var(--gp-field) !important;
            min-height: 0;
            padding-block: 64px;
          }
          ${scopeSelector} [data-gp-caption] {
            opacity: 1 !important;
          }
          ${scopeSelector} [data-gp-hint] {
            display: none;
          }
        }
      `}</style>

      <noscript>
        <style>{`
          ${scopeSelector} [data-gp-fallback] { display: grid; }
          ${scopeSelector} [data-gp-hint] { display: none; }
        `}</style>
      </noscript>

      <div data-gp-viewport="true" aria-hidden="true" />

      <div data-gp-pin="true">
        <div data-gp-field="true" aria-hidden="true">
          {background ?? (
            <div
              data-gp-default-field="true"
              style={{
                position: 'absolute',
                inset: 0,
                transform: 'scale(var(--gp-field-scale, 1))',
                background:
                  'radial-gradient(circle at 18% 12%, rgba(139, 92, 246, 0.4), transparent 45%), radial-gradient(circle at 82% 25%, rgba(6, 182, 212, 0.25), transparent 40%), radial-gradient(circle at 50% 80%, rgba(15, 23, 42, 0.9), transparent 60%), linear-gradient(135deg, #030712 0%, #0b1120 50%, #020617 100%)',
              }}
            />
          )}
        </div>

        <svg data-gp-art="true" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <text
                data-gp-glyph="true"
                x="0"
                y="0"
                style={{
                  fontFamily,
                  fontWeight: parsedFontWeight,
                  fontSize: 100,
                  fontKerning: 'none',
                  fontVariantLigatures: 'none',
                  letterSpacing: 0,
                }}
              >
                {normalizedWord}
              </text>
            </clipPath>
          </defs>
          <g
            data-gp-marks="true"
            style={{
              visibility: annotations ? 'visible' : 'hidden',
            }}
          >
            <path />
          </g>
        </svg>

        <div
          data-gp-choices="true"
          role="radiogroup"
          aria-label="Choose the letter to enter through"
        >
          {chars.map(({ char, index }, pos) => (
            <button
              key={index}
              type="button"
              role="radio"
              aria-checked="false"
              tabIndex={-1}
              data-gp-letter={index}
              aria-label={`${char}, letter ${pos + 1} of ${chars.length}`}
            />
          ))}
        </div>

        <label data-gp-touch-picker="true">
          <span
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              overflow: 'hidden',
              clipPath: 'inset(50%)',
            }}
          >
            Entry letter
          </span>
          <select data-gp-select="true" defaultValue="">
            <option value="" disabled>
              Choose a letter
            </option>
            {chars.map(({ char, index }, pos) => (
              <option key={index} value={index}>
                {pos + 1} · {char}
              </option>
            ))}
          </select>
        </label>

        {front && <div data-gp-front="true">{front}</div>}

        <span
          data-gp-fallback="true"
          aria-hidden="true"
          style={{ fontFamily, fontWeight: parsedFontWeight }}
        >
          {normalizedWord}
        </span>

        <div data-gp-caption="true">
          <span data-gp-hint="true" aria-hidden="true">
            {interactive ? 'SCROLL TO INITIALIZE' : ''}
          </span>
          <a
            data-gp-enter="true"
            href={`#${sectionId}-content`}
            onClick={(e) => {
              e.preventDefault();
              const target = document.getElementById(`${sectionId}-content`);
              if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            {enterLabel}
            <span aria-hidden="true">↘</span>
          </a>
        </div>
      </div>

      <div data-gp-content="true" id={`${sectionId}-content`} tabIndex={-1}>
        {children ?? (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
              MARDUK GPU Orchestration
            </h2>
            <p style={{ color: '#94a3b8' }}>
              Intelligent scheduling and GPU inference resource control.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default GlyphPortal;
