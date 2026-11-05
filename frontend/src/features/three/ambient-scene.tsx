"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { RenderTier } from "./capabilities";

/*
 * SAYNTRA Living Network 3D — one fixed, full-viewport canvas shared by the
 * marketing and authentication pages. Two silk ribbons (custom shader) float
 * over a sparse circuit network whose data pulses run entirely on the GPU.
 */

const ribbonVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uScroll;
  uniform vec2 uPointer;
  varying vec2 vUv;
  varying vec3 vPos;
  varying float vElev;
  void main() {
    vUv = uv;
    vec3 p = position;
    float t = uTime * 0.11 + uSeed * 4.0;
    // Long S-curve along the ribbon, plus layered swells across it.
    p.y += sin(p.x * 0.32 + t) * 0.9 + sin(p.x * 0.11 - t * 0.6) * 0.6;
    float w = sin(p.x * 0.42 + t * 1.8) * 0.5
            + sin(p.x * 0.85 - p.y * 0.7 + t * 1.2) * 0.24
            + sin(p.y * 1.6 + t * 0.8) * 0.1;
    p.y += uScroll * (1.4 + uSeed);
    vec4 world = modelMatrix * vec4(p, 1.0);
    float d = distance(world.xy, uPointer);
    w += exp(-d * d * 0.45) * 0.42;
    p.z += w;
    vElev = w;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const ribbonFragment = /* glsl */ `
  uniform float uTime;
  uniform float uDark;
  uniform float uScroll;
  uniform float uSeed;
  uniform float uIntensity;
  uniform float uRtl;
  uniform vec2 uResolution;
  varying vec2 vUv;
  varying vec3 vPos;
  varying float vElev;
  vec3 palette(float x) {
    vec3 blue = vec3(0.231, 0.510, 0.965);
    vec3 teal = vec3(0.078, 0.722, 0.651);
    vec3 mint = vec3(0.176, 0.831, 0.749);
    vec3 lav  = vec3(0.545, 0.361, 0.965);
    vec3 c = mix(blue, teal, smoothstep(0.05, 0.45, x));
    c = mix(c, mint, smoothstep(0.45, 0.72, x));
    c = mix(c, lav, smoothstep(0.78, 1.0, x) * 0.7);
    return c;
  }
  void main() {
    // Surface normal from screen-space derivatives: real shading, no normals.
    vec3 n = normalize(cross(dFdx(vPos), dFdy(vPos)));
    vec3 l = normalize(vec3(-0.35, 0.65, 0.7));
    float diff = clamp(dot(n, l) * 0.5 + 0.5, 0.0, 1.0);
    vec3 v = normalize(-vPos);
    float spec = pow(clamp(dot(reflect(-l, n), v), 0.0, 1.0), 28.0);
    float fres = pow(1.0 - clamp(abs(dot(n, v)), 0.0, 1.0), 2.0);

    float x = clamp(vUv.x * 0.9 + uSeed * 0.18 + uScroll * 0.12, 0.0, 1.0);
    vec3 base = palette(x);
    vec3 light = mix(base, vec3(1.0), 0.2);
    vec3 col = mix(light, base * 0.9, uDark);
    // Light mode needs a wider shading range to read as silk on white.
    col *= mix(0.45 + 0.75 * diff, 0.62 + 0.5 * diff, uDark);
    // Silk threads following the surface.
    float th = abs(fract(vUv.y * 46.0 + vElev * 1.6 - uTime * 0.015) - 0.5);
    float thread = smoothstep(0.1, 0.0, th) * (0.18 + 0.22 * uDark);
    col += thread * mix(base * 0.55, mix(vec3(1.0), base, 0.5), uDark);
    col += spec * mix(base * 0.6 + 0.25, vec3(0.6), uDark) + fres * base * 0.25;

    float band = smoothstep(0.0, 0.32, vUv.y) * smoothstep(1.0, 0.68, vUv.y);
    float ends = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
    // Fade the ribbons where the copy column sits (mirrored for RTL).
    float side = uRtl > 0.5 ? 1.0 - gl_FragCoord.x / uResolution.x : gl_FragCoord.x / uResolution.x;
    float copy = mix(0.45, 1.0, smoothstep(0.18, 0.5, side));
    float alpha = band * ends * copy * mix(0.42, 0.5, uDark) * uIntensity * (0.7 + 0.3 * diff);
    gl_FragColor = vec4(col, alpha);
  }
`;

const pulseVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixel;
  attribute vec3 aEnd;
  attribute float aOffset;
  varying float vFade;
  void main() {
    float k = fract(uTime * 0.12 + aOffset);
    vec3 p = mix(position, aEnd, k);
    vFade = sin(k * 3.14159);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uPixel * 5.0 / -mv.z * 4.0;
    gl_Position = projectionMatrix * mv;
  }
`;

const nodeVertex = /* glsl */ `
  uniform float uPixel;
  uniform float uTime;
  attribute float aPhase;
  varying float vFade;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vFade = 0.65 + 0.35 * sin(uTime * 0.8 + aPhase);
    gl_PointSize = uPixel * 4.5 / -mv.z * 4.0;
    gl_Position = projectionMatrix * mv;
  }
`;

const dotFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.15, d);
    gl_FragColor = vec4(uColor, a * vFade * uOpacity);
    #include <colorspace_fragment>
  }
`;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Signals {
  pointer: { x: number; y: number };
  scroll: number;
  dark: number;
}

function Ribbon({
  seed,
  signals,
  reduced,
  position,
  rotation,
  segments,
}: {
  seed: number;
  signals: React.RefObject<Signals>;
  reduced: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  segments: [number, number];
}) {
  const viewport = useThree((s) => s.viewport);
  const resources = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(18, 3.4, segments[0], segments[1]);
    const material = new THREE.ShaderMaterial({
      vertexShader: ribbonVertex,
      fragmentShader: ribbonFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: seed * 10 },
        uSeed: { value: seed },
        uScroll: { value: 0 },
        uDark: { value: 0 },
        uIntensity: { value: 1 },
        uRtl: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uPointer: { value: new THREE.Vector2(0, 0) },
      },
    });
    return { geometry, material };
  }, [seed, segments]);
  const live = useRef(resources);
  useEffect(() => {
    live.current = resources;
    return () => {
      resources.geometry.dispose();
      resources.material.dispose();
    };
  }, [resources]);

  useFrame((state, dt) => {
    const u = live.current.material.uniforms;
    const sig = signals.current;
    if (!sig) return;
    u.uRtl.value = document.documentElement.dir === "rtl" ? 1 : 0;
    state.gl.getDrawingBufferSize(u.uResolution.value as THREE.Vector2);
    if (!reduced) u.uTime.value += Math.min(dt, 0.05);
    u.uScroll.value = sig.scroll;
    u.uDark.value = sig.dark;
    (u.uPointer.value as THREE.Vector2).set(
      (sig.pointer.x * viewport.width) / 2,
      (sig.pointer.y * viewport.height) / 2,
    );
  });

  return (
    <mesh
      geometry={resources.geometry}
      material={resources.material}
      position={position}
      rotation={rotation}
      frustumCulled={false}
    />
  );
}

function Network({
  signals,
  reduced,
  count,
}: {
  signals: React.RefObject<Signals>;
  reduced: boolean;
  count: number;
}) {
  const group = useRef<THREE.Group>(null);
  const gl = useThree((s) => s.gl);
  const resources = useMemo(() => {
    const random = rng(2024);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      pts.push(
        new THREE.Vector3(
          (random() - 0.5) * 18,
          (random() - 0.5) * 10,
          -3 - random() * 3,
        ),
      );
    }
    // Link each node to up to two near neighbours: a sparse circuit, not a web.
    const links: Array<[number, number]> = [];
    pts.forEach((p, i) => {
      const near = pts
        .map((q, j) => ({ j, d: p.distanceTo(q) }))
        .filter((o) => o.j > i && o.d < 1.9)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      near.forEach((o) => links.push([i, o.j]));
    });
    const nodeGeo = new THREE.BufferGeometry().setFromPoints(pts);
    nodeGeo.setAttribute(
      "aPhase",
      new THREE.BufferAttribute(Float32Array.from(pts.map(() => random() * 6.28)), 1),
    );
    // Route each link like a PCB trace: a straight run, then a 45° chamfer.
    const segments: Array<[THREE.Vector3, THREE.Vector3]> = [];
    links.forEach(([a, b]) => {
      const p = pts[a];
      const q = pts[b];
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const run = Math.sign(dx) * Math.max(Math.abs(dx) - Math.abs(dy), 0);
      const corner = new THREE.Vector3(p.x + run, p.y, (p.z + q.z) / 2);
      segments.push([p, corner], [corner, q]);
    });
    const linePos = new Float32Array(segments.length * 6);
    segments.forEach(([p, q], k) => {
      linePos.set([p.x, p.y, p.z, q.x, q.y, q.z], k * 6);
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    // Pulses travel along a subset of links.
    const pulseLinks = segments.filter((_, k) => k % 3 === 0);
    const start = new Float32Array(pulseLinks.length * 3);
    const end = new Float32Array(pulseLinks.length * 3);
    const offset = new Float32Array(pulseLinks.length);
    pulseLinks.forEach(([p, q], k) => {
      start.set([p.x, p.y, p.z], k * 3);
      end.set([q.x, q.y, q.z], k * 3);
      offset[k] = random();
    });
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute("position", new THREE.BufferAttribute(start, 3));
    pulseGeo.setAttribute("aEnd", new THREE.BufferAttribute(end, 3));
    pulseGeo.setAttribute("aOffset", new THREE.BufferAttribute(offset, 1));
    const pixel = Math.min(gl.getPixelRatio(), 2);
    const nodeMat = new THREE.ShaderMaterial({
      vertexShader: nodeVertex,
      fragmentShader: dotFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uPixel: { value: pixel },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#3b82f6") },
        uOpacity: { value: 0.6 },
      },
    });
    const pulseMat = new THREE.ShaderMaterial({
      vertexShader: pulseVertex,
      fragmentShader: dotFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uPixel: { value: pixel },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#2dd4bf") },
        uOpacity: { value: 0.9 },
      },
    });
    const lineMat = new THREE.LineBasicMaterial({
      color: "#3b82f6",
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    return { nodeGeo, lineGeo, pulseGeo, nodeMat, pulseMat, lineMat };
  }, [count, gl]);
  const live = useRef(resources);
  useEffect(() => {
    live.current = resources;
    return () => {
      resources.nodeGeo.dispose();
      resources.lineGeo.dispose();
      resources.pulseGeo.dispose();
      resources.nodeMat.dispose();
      resources.pulseMat.dispose();
      resources.lineMat.dispose();
    };
  }, [resources]);

  useFrame((_, dt) => {
    const r = live.current;
    const sig = signals.current;
    const g = group.current;
    if (!sig || !g) return;
    const step = Math.min(dt, 0.05);
    if (!reduced) {
      r.nodeMat.uniforms.uTime.value += step;
      r.pulseMat.uniforms.uTime.value += step;
    }
    // Dark mode: brighter mint pulses; light mode: calmer blue structure.
    r.lineMat.opacity = 0.07 + sig.dark * 0.12;
    r.nodeMat.uniforms.uOpacity.value = 0.35 + sig.dark * 0.4;
    // Parallax: the network sits deeper than the ribbons and moves less.
    const k = reduced ? 1 : Math.min(1, step * 3);
    g.rotation.y += (sig.pointer.x * 0.07 - g.rotation.y) * k;
    g.rotation.x += (-sig.pointer.y * 0.05 - g.rotation.x) * k;
    g.position.y = sig.scroll * 2.2;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={resources.lineGeo} material={resources.lineMat} />
      <points geometry={resources.nodeGeo} material={resources.nodeMat} />
      <points geometry={resources.pulseGeo} material={resources.pulseMat} />
    </group>
  );
}

function Rig({
  signals,
  reduced,
  children,
}: {
  signals: React.RefObject<Signals>;
  reduced: boolean;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = group.current;
    const sig = signals.current;
    if (!g || !sig) return;
    const k = reduced ? 1 : Math.min(1, dt * 2.5);
    g.rotation.y += (sig.pointer.x * 0.05 - g.rotation.y) * k;
    g.rotation.x += (-sig.pointer.y * 0.04 + sig.scroll * 0.25 - g.rotation.x) * k;
  });
  return <group ref={group}>{children}</group>;
}

function readDark() {
  const theme = document.documentElement.dataset.theme;
  if (theme === "dark") return 1;
  if (theme === "light") return 0;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? 1 : 0;
}

function SceneContent({ tier, reduced }: { tier: RenderTier; reduced: boolean }) {
  const signals = useRef<Signals>({ pointer: { x: 0, y: 0 }, scroll: 0, dark: 0 });
  const target = useRef({ x: 0, y: 0, dark: 0 });
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    target.current.dark = readDark();
    signals.current.dark = target.current.dark;
    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      signals.current.scroll = max > 0 ? window.scrollY / max : 0;
      if (reduced) invalidate();
    };
    const onTheme = () => {
      target.current.dark = readDark();
      if (reduced) {
        signals.current.dark = target.current.dark;
        invalidate();
      }
    };
    const observer = new MutationObserver(onTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", onTheme);
    if (!reduced) window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", onTheme);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [reduced, invalidate]);

  // Ease raw pointer/theme targets into the shared signal object.
  useFrame((_, dt) => {
    const s = signals.current;
    const t = target.current;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 3);
    s.pointer.x += (t.x - s.pointer.x) * k;
    s.pointer.y += (t.y - s.pointer.y) * k;
    s.dark += (t.dark - s.dark) * (reduced ? 1 : 1 - Math.exp(-dt * 4));
  });

  const high = tier === "high";
  return (
    <Rig signals={signals} reduced={reduced}>
      <Network signals={signals} reduced={reduced} count={high ? 70 : 42} />
      <Ribbon
        seed={0}
        signals={signals}
        reduced={reduced}
        position={[0, 0.6, -0.4]}
        rotation={[-0.25, 0.1, -0.22]}
        segments={high ? [220, 44] : [120, 24]}
      />
      <Ribbon
        seed={0.6}
        signals={signals}
        reduced={reduced}
        position={[0.8, -2.2, -1.6]}
        rotation={[-0.35, -0.15, -0.12]}
        segments={high ? [200, 40] : [110, 22]}
      />
    </Rig>
  );
}

export default function AmbientScene({
  tier,
  reduced,
}: {
  tier: RenderTier;
  reduced: boolean;
}) {
  const high = tier === "high";
  return (
    <Canvas
      className="ambient-canvas"
      dpr={high ? [1, 1.25] : [0.75, 1]}
      frameloop={reduced ? "demand" : "always"}
      camera={{ position: [0, 0, 8], fov: 50 }}
      gl={{ antialias: high, alpha: true, powerPreference: "low-power" }}
      aria-hidden="true"
    >
      <SceneContent tier={tier} reduced={reduced} />
    </Canvas>
  );
}
