"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, PerformanceMonitor } from "@react-three/drei";
import type { Locale } from "@/components/providers";
import { Device, restingState, type DeviceState } from "./device-model";
import { Studio, configureRenderer, damp } from "./studio";
import type { RenderTier } from "./capabilities";

interface HeroSceneProps {
  language: Locale;
  active: boolean;
  reducedMotion: boolean;
  tier: RenderTier;
}

export default function HeroScene({
  language,
  active,
  reducedMotion,
  tier,
}: HeroSceneProps) {
  const stateRef = useRef<DeviceState>(restingState());
  const pointer = useRef({ x: 0, y: 0 });
  const [dpr, setDpr] = useState<number>(tier === "high" ? 1.75 : 1.25);
  const [shadows, setShadows] = useState(true);

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion]);

  return (
    <Canvas
      className="device-canvas"
      dpr={dpr}
      frameloop={!active ? "never" : reducedMotion ? "demand" : "always"}
      camera={{ position: [0, 0.04, 6.1], fov: 28 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={configureRenderer}
      aria-hidden="true"
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setShadows(false);
        }}
      />
      <Studio />
      <HeroPose
        reducedMotion={reducedMotion}
        pointer={pointer}
        mirror={language === "ar"}
      >
        <group scale={1.64}>
          <Device
            stateRef={stateRef}
            screenStage={1}
            language={language}
            detail={tier}
          />
        </group>
      </HeroPose>
      {shadows && (
        <ContactShadows
          position={[0, -1.38, 0]}
          opacity={0.4}
          scale={4.5}
          blur={1.8}
          far={1.2}
          resolution={tier === "high" ? 512 : 256}
          color="#1e3a8a"
        />
      )}
    </Canvas>
  );
}

/** Wraps children in the animated hero pose. */
function HeroPose({
  children,
  reducedMotion,
  pointer,
  mirror,
}: {
  children: React.ReactNode;
  reducedMotion: boolean;
  pointer: React.RefObject<{ x: number; y: number }>;
  /** In RTL the copy sits on the right, so the device turns toward it. */
  mirror: boolean;
}) {
  const dir = mirror ? -1 : 1;
  const group = useRef<THREE.Group>(null);
  const intro = useRef(reducedMotion ? 1 : 0);
  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const delta = Math.min(dt, 1 / 20);
    intro.current = reducedMotion ? 1 : Math.min(1, intro.current + delta / 1.6);
    const k = 1 - Math.pow(1 - intro.current, 3);
    const p = pointer.current ?? { x: 0, y: 0 };
    const time = state.clock.elapsedTime;
    // Pointer parallax fades in only once the entrance has nearly settled.
    const follow = reducedMotion ? 0 : Math.min(1, Math.max(0, (k - 0.8) / 0.2));
    const targetY = dir * (-0.5 + (1 - k) * -0.9) + p.x * 0.22 * follow;
    const targetX = 0.1 - p.y * 0.12 * follow;
    g.rotation.y = damp(g.rotation.y, targetY, 4, delta);
    g.rotation.x = damp(g.rotation.x, targetX, 4, delta);
    g.rotation.z = dir * 0.06;
    g.position.y =
      (1 - k) * -0.1 + (reducedMotion ? 0 : Math.sin(time * 0.7) * 0.03);
  });
  return (
    <group
      ref={group}
      rotation={[0.1, dir * (reducedMotion ? -0.5 : -1.4), dir * 0.06]}
    >
      {children}
    </group>
  );
}
