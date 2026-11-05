"use client";
import { useSyncExternalStore } from "react";
import type { ScreenStage } from "./textures";

/*
 * Lightweight helpers used by the page before the 3D bundle loads.
 * This module must not import three.js so the landing page stays small.
 */

export type RenderTier = "high" | "balanced";

const noopSubscribe = () => () => {};

let tierCache: RenderTier | null = null;
function readTier(): RenderTier {
  if (tierCache) return tierCache;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const weak =
    (nav.hardwareConcurrency ?? 8) <= 4 ||
    (nav.deviceMemory ?? 8) <= 4 ||
    window.matchMedia("(max-width: 760px)").matches;
  tierCache = weak ? "balanced" : "high";
  return tierCache;
}

/** Chooses a render tier from coarse device signals (client only). */
export function useRenderTier(): RenderTier {
  return useSyncExternalStore(noopSubscribe, readTier, () => "balanced");
}

let webglCache: boolean | null = null;
function readWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    webglCache = Boolean(ctx);
    ctx?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglCache = false;
  }
  return webglCache;
}

/** `null` during server rendering, then whether WebGL is usable. */
export function useWebGLAvailable(): boolean | null {
  return useSyncExternalStore<boolean | null>(noopSubscribe, readWebGL, () => null);
}

/** Maps story scroll progress to the repair state shown on the device. */
export function stageForProgress(p: number): ScreenStage {
  if (p < 0.15) return 0;
  if (p < 0.35) return 1;
  if (p < 0.52) return 2;
  if (p < 0.73) return 3;
  if (p < 0.87) return 4;
  return 5;
}
