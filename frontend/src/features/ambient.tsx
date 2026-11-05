"use client";
import dynamic from "next/dynamic";
import { useEffect, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";
import { useRenderTier, useWebGLAvailable } from "./three/capabilities";

const AmbientScene = dynamic(() => import("./three/ambient-scene"), {
  ssr: false,
});

const LITE_QUERY = "(max-width: 760px), (pointer: coarse)";
const subscribeLite = (cb: () => void) => {
  const media = window.matchMedia(LITE_QUERY);
  media.addEventListener("change", cb);
  return () => media.removeEventListener("change", cb);
};

/**
 * Living Network 3D background for marketing and authentication pages.
 * Phones, touch devices and browsers without WebGL keep the lightweight CSS
 * Living Network, which stays in the markup as the fallback.
 */
export function AmbientBackdrop() {
  const webgl = useWebGLAvailable();
  const tier = useRenderTier();
  const reduced = useReducedMotion() ?? false;
  const lite = useSyncExternalStore(
    subscribeLite,
    () => window.matchMedia(LITE_QUERY).matches,
    () => true,
  );
  const enabled = webgl === true && !lite;

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("ambient-3d");
    return () => root.classList.remove("ambient-3d");
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div className="ambient-layer" aria-hidden="true">
      <AmbientScene tier={tier} reduced={reduced} />
    </div>
  );
}
