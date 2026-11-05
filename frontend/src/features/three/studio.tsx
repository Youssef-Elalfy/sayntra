"use client";
import * as THREE from "three";
import { Environment, Lightformer } from "@react-three/drei";

export type { RenderTier } from "./capabilities";

/**
 * Product-photography lighting built from procedural light cards: no HDR file
 * is downloaded. The environment is rendered once (frames=1), so reflections
 * cost nothing per frame.
 */
export function Studio() {
  return (
    <>
      <ambientLight intensity={0.22} />
      <directionalLight position={[3, 4, 5]} intensity={1.25} />
      <directionalLight position={[-4, -1, -3]} intensity={0.35} color="#9cc3ff" />
      {/* Back rim light: separates the bevelled far edge from the page. */}
      <directionalLight position={[-2, 3, -4]} intensity={0.8} />
      <Environment frames={1} resolution={512} environmentIntensity={0.95}>
        {/* Large soft card behind: gives the dark glass a readable sheen. */}
        <Lightformer
          form="rect"
          intensity={1.2}
          position={[0, 1, -6]}
          scale={[10, 6, 1]}
        />
        {/* Narrow bright strip in front: one clean highlight band on glass. */}
        <Lightformer
          form="rect"
          intensity={2.6}
          position={[2.2, 0.5, 4]}
          rotation-y={Math.PI}
          scale={[0.35, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.4}
          position={[0, 5, 1]}
          rotation-x={Math.PI / 2}
          scale={[9, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={3.2}
          position={[-5, 1, 1]}
          rotation-y={Math.PI / 2}
          scale={[0.7, 8, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#a9c8ff"
          position={[5, 0.5, 0]}
          rotation-y={-Math.PI / 2}
          scale={[0.6, 8, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.7}
          position={[0, 0, 6]}
          scale={[8, 2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#5eead4"
          position={[-2, -3, -5]}
          scale={[6, 2, 1]}
        />
        <Lightformer
          form="ring"
          intensity={1.6}
          color="#c4b5fd"
          position={[3, 3, -4]}
          scale={1.6}
        />
      </Environment>
    </>
  );
}

export function configureRenderer({ gl }: { gl: THREE.WebGLRenderer }) {
  // Khronos PBR Neutral keeps brand colours on the screen and materials true.
  gl.toneMapping = THREE.NeutralToneMapping;
  gl.toneMappingExposure = 1.05;
}

/** Frame-rate independent exponential smoothing toward a target. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
