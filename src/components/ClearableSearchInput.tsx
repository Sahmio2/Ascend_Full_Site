"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

export interface ClearableSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  ariaLabel?: string;
  autoFocus?: boolean;
  id?: string;
}

// Minimal cubic-bezier(x1,y1,x2,y2) sampler matching CSS transitions
function bezier(str: string): (t: number) => number {
  const m = String(str).match(
    /cubic-bezier\(([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)\)/
  );
  if (!m) return (t: number) => t;
  const [x1, y1, x2, y2] = m.slice(1).map(parseFloat);
  const cx = 3 * x1,
    bx = 3 * (x2 - x1) - cx,
    ax = 1 - cx - bx;
  const cy = 3 * y1,
    by = 3 * (y2 - y1) - cy,
    ay = 1 - cy - by;
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let s = t;
    for (let i = 0; i < 8; i++) {
      const dx = ((ax * s + bx) * s + cx) * s - t;
      const d = (3 * ax * s + 2 * bx) * s + cx;
      if (Math.abs(dx) < 1e-6 || d === 0) break;
      s -= dx / d;
    }
    return ((ay * s + by) * s + cy) * s;
  };
}

export default function ClearableSearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  className = "",
  inputClassName = "",
  style,
  inputStyle,
  ariaLabel = "Search",
  autoFocus = false,
  id,
}: ClearableSearchInputProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const pholdRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Sync geometry & styling from the input to mirror/placeholder
  const syncGeometry = useCallback(() => {
    if (!inputRef.current) return;
    const cs = window.getComputedStyle(inputRef.current);
    if (mirrorRef.current) {
      mirrorRef.current.style.paddingLeft = cs.paddingLeft;
      mirrorRef.current.style.paddingRight = cs.paddingRight;
      mirrorRef.current.style.font = cs.font;
      mirrorRef.current.style.letterSpacing = cs.letterSpacing;
      mirrorRef.current.style.color = cs.color;
    }
    if (pholdRef.current) {
      pholdRef.current.style.paddingLeft = cs.paddingLeft;
      pholdRef.current.style.paddingRight = cs.paddingRight;
      pholdRef.current.style.font = cs.font;
      pholdRef.current.style.letterSpacing = cs.letterSpacing;
      pholdRef.current.style.color = "var(--muted, #8a8478)";
    }
  }, []);

  useEffect(() => {
    syncGeometry();
    const handleResize = () => syncGeometry();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [syncGeometry]);

  // Sync mirror text with current input value
  useEffect(() => {
    if (mirrorRef.current) {
      mirrorRef.current.textContent = value.replace(/ /g, "\u00a0");
    }
  }, [value]);

  // Build per-word radial glow streaks
  const buildGlow = (text: string): string => {
    if (!wrapRef.current || !inputRef.current) return "";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.font = window.getComputedStyle(inputRef.current).font;
    const rgb = "255,255,255"; // white streak in dark mode
    const w = wrapRef.current.clientWidth || 280;
    const padLeft =
      parseFloat(window.getComputedStyle(inputRef.current).paddingLeft) || 14;
    const spread = 1.5;
    const layers: string[] = [];
    let x = 0;
    text.split(/(\s+)/).forEach((seg) => {
      const segW = ctx.measureText(seg).width;
      if (seg.trim()) {
        const cx = padLeft + x + segW / 2;
        const hw = Math.max(segW * 0.45, 8) * spread;
        [
          [0, 0.8, 7, 0.22],
          [hw * 0.45, 0.55, 8, 0.18],
          [-hw * 0.4, 0.65, 6, 0.16],
          [hw * 0.15, 0.9, 5, 0.14],
        ].forEach(([dx, rwm, rh, a]) => {
          const lx = (((cx + dx) / w) * 100).toFixed(2);
          layers.push(
            `radial-gradient(ellipse ${Math.max(hw * rwm, 2).toFixed(1)}px ${rh}px at ${lx}% 100%, rgba(${rgb},${a}), transparent)`
          );
        });
      }
      x += segW;
    });
    return layers.join(", ");
  };

  const handleClearWithAnimation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isClearing || !value) return;

    // Check prefers-reduced-motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      onChange("");
      if (onClear) onClear();
      inputRef.current?.focus({ preventScroll: true });
      return;
    }

    const wrapEl = wrapRef.current;
    const inputEl = inputRef.current;
    const mirrorEl = mirrorRef.current;
    const pholdEl = pholdRef.current;
    const glowEl = glowRef.current;
    if (!wrapEl || !inputEl || !mirrorEl || !pholdEl || !glowEl) return;

    setIsClearing(true);
    const keepFocus = document.activeElement === inputEl;
    const textToClear = value;
    mirrorEl.textContent = textToClear.replace(/ /g, "\u00a0");

    const rootStyle = window.getComputedStyle(document.documentElement);
    const num = (name: string, fallback: number) => {
      const v = parseFloat(rootStyle.getPropertyValue(name));
      return Number.isFinite(v) ? v : fallback;
    };

    const total = num("--clear-dur", 1000);
    const outDur = num("--clear-out-dur", 400);
    const inDur = num("--clear-in-dur", 400);
    const outFly = num("--clear-out-fly", 12);
    const inFly = num("--clear-in-fly", 12);
    const blur = num("--clear-blur", 2);
    const delay = num("--glow-delay", 50);
    const peakAt = num("--glow-peak-at", 0.15);
    const gOp = num("--glow-opacity", 0.85);

    const easeOutStr =
      rootStyle.getPropertyValue("--clear-out-ease").trim() ||
      "cubic-bezier(0.22, 1, 0.36, 1)";
    const easeInStr =
      rootStyle.getPropertyValue("--clear-in-ease").trim() ||
      "cubic-bezier(0.22, 1, 0.36, 1)";
    const easeOut = bezier(easeOutStr);
    const easeIn = bezier(easeInStr);

    glowEl.style.background = buildGlow(textToClear);
    glowEl.style.opacity = "0";
    pholdEl.style.transform = `translateY(-${inFly}px)`;
    pholdEl.style.opacity = "0.9";
    pholdEl.style.filter = `blur(${blur}px)`;

    const t0 = performance.now();
    const tick = (now: number) => {
      const el = now - t0;
      const eo = easeOut(Math.min(1, el / outDur));
      mirrorEl.style.transform = `translateY(${(eo * outFly).toFixed(1)}px)`;
      mirrorEl.style.opacity = (1 - eo).toFixed(3);
      mirrorEl.style.filter = `blur(${(eo * blur).toFixed(1)}px)`;

      const ei = easeIn(Math.min(1, el / inDur));
      pholdEl.style.transform = `translateY(${(-inFly + ei * inFly).toFixed(1)}px)`;
      pholdEl.style.opacity = (0.9 + ei * 0.1).toFixed(3);
      pholdEl.style.filter = `blur(${(blur - ei * blur).toFixed(1)}px)`;

      let g = 0;
      if (el > delay) {
        const gp = Math.min(1, (el - delay) / Math.max(1, total - delay));
        g = gp < peakAt ? gp / peakAt : 1 - (gp - peakAt) / (1 - peakAt);
      }
      glowEl.style.opacity = (g * gOp).toFixed(3);

      if (el < total) {
        requestAnimationFrame(tick);
      } else {
        mirrorEl.style.cssText = "";
        pholdEl.style.cssText = "";
        mirrorEl.textContent = "";
        glowEl.style.opacity = "0";
        glowEl.style.background = "";
        onChange("");
        if (onClear) onClear();
        setIsClearing(false);
        if (keepFocus) {
          requestAnimationFrame(() => inputEl.focus({ preventScroll: true }));
        }
      }
    };

    requestAnimationFrame(tick);
  };

  const hasValue = value.length > 0;

  return (
    <div
      ref={wrapRef}
      className={`t-clear ${hasValue ? "has-value" : ""} ${
        isClearing ? "is-clearing" : ""
      } ${className}`.trim()}
      style={style}
    >
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=""
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        className={inputClassName}
        style={{
          width: "100%",
          paddingRight: hasValue ? "38px" : undefined,
          ...inputStyle,
        }}
      />

      {/* Visual mirror used to fly down & blur during clear */}
      <div ref={mirrorRef} className="t-clear-mirror" aria-hidden="true">
        {value.replace(/ /g, "\u00a0")}
      </div>

      {/* Placeholder that drops in during clear and resting empty state */}
      <div ref={pholdRef} className="t-clear-placeholder" aria-hidden="true">
        {placeholder}
      </div>

      {/* Per-word radial streak overlay */}
      <div ref={glowRef} className="t-clear-glow" aria-hidden="true" />

      {/* Clear button (visible when input has value) */}
      <button
        type="button"
        className="t-clear-btn"
        aria-label="Clear search"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleClearWithAnimation}
      >
        ✕
      </button>
    </div>
  );
}
