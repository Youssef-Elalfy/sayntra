"use client";
import { useEffect, useRef, useState } from "react";

/**
 * One delegated pointer listener drives every `[data-tilt]` surface through
 * CSS custom properties. Cards stay plain DOM (no per-card JS state or WebGL);
 * `data-tilt="6"` sets the maximum tilt in degrees. Disabled for touch and
 * coarse pointers and when the user prefers reduced motion.
 */
export function TiltController() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current: HTMLElement | null = null;
    let raf = 0;
    let px = 0;
    let py = 0;

    const release = (el: HTMLElement) => {
      el.classList.remove("is-tilting");
      for (const name of ["--tilt-x", "--tilt-y", "--tilt-px", "--tilt-py"])
        el.style.removeProperty(name);
    };
    const apply = () => {
      raf = 0;
      const el = current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (px - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (py - r.top) / r.height));
      const max = Number(el.dataset.tilt) || 6;
      el.style.setProperty("--tilt-x", `${((0.5 - y) * max).toFixed(2)}deg`);
      el.style.setProperty("--tilt-y", `${((x - 0.5) * max).toFixed(2)}deg`);
      el.style.setProperty("--tilt-px", (x - 0.5).toFixed(3));
      el.style.setProperty("--tilt-py", (y - 0.5).toFixed(3));
      el.style.setProperty("--glare-x", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--glare-y", `${(y * 100).toFixed(1)}%`);
    };
    const onMove = (e: PointerEvent) => {
      if (!fine.matches || reduce.matches || e.pointerType !== "mouse") return;
      const el =
        e.target instanceof Element
          ? e.target.closest<HTMLElement>("[data-tilt]")
          : null;
      if (el !== current) {
        if (current) release(current);
        current = el;
        current?.classList.add("is-tilting");
      }
      if (!current) return;
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = (e: PointerEvent) => {
      if (!e.relatedTarget && current) {
        release(current);
        current = null;
      }
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onLeave, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave);
      cancelAnimationFrame(raf);
      if (current) release(current);
    };
  }, []);
  return null;
}

/** Counts up to a number once, respecting reduced motion. */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = from.current;
    if (reduce || start === value) {
      from.current = value;
      const id = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(start + (value - start) * eased));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{shown}</>;
}
