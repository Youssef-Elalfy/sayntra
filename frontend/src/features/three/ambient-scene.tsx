"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { RenderTier } from "./capabilities";

/*
 * SAYNTRA ambient environment: one fixed, full-viewport canvas shared by the
 * marketing and authentication pages.
 *
 * Layers, back to front: a haze backdrop with drifting glows, soft volumetric
 * light shafts, three silk ribbons (smooth analytic normals + anisotropic
 * satin sheen) and a few out-of-focus dust motes. Everything moves on its own
 * clock: the scene never follows the pointer. Scrolling only shifts depth.
 */

/* ------------------------------ Backdrop -------------------------------- */

const backdropVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.999, 1.0);
  }
`;

const backdropFragment = /* glsl */ `
  uniform float uTime;
  uniform float uDark;
  uniform float uScroll;
  uniform vec2 uAspect;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 p = vUv * uAspect;
    float t = uTime * 0.035;
    // Two large, slowly orbiting glows give the haze its depth.
    vec2 g1 = vec2(0.72 + 0.12 * sin(t), 0.62 + 0.1 * cos(t * 0.8) - uScroll * 0.25) * uAspect;
    vec2 g2 = vec2(0.22 + 0.1 * cos(t * 0.7), 0.3 + 0.12 * sin(t * 0.9)) * uAspect;
    float d1 = exp(-dot(p - g1, p - g1) * 3.2);
    float d2 = exp(-dot(p - g2, p - g2) * 4.0);
    vec3 darkTop = vec3(0.043, 0.063, 0.125);
    vec3 darkBottom = vec3(0.055, 0.094, 0.176);
    vec3 lightTop = vec3(0.969, 0.980, 0.988);
    vec3 lightBottom = vec3(0.925, 0.953, 0.973);
    vec3 dark = mix(darkBottom, darkTop, vUv.y);
    dark += vec3(0.05, 0.32, 0.36) * d1 * 0.42 + vec3(0.12, 0.22, 0.55) * d2 * 0.34;
    vec3 light = mix(lightBottom, lightTop, vUv.y);
    light = mix(light, vec3(0.74, 0.91, 0.95), d1 * 0.6);
    light = mix(light, vec3(0.80, 0.86, 0.99), d2 * 0.55);
    vec3 col = mix(light, dark, uDark);
    // Film-grain dither prevents gradient banding on 8-bit displays.
    col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ------------------------------ Light shafts ---------------------------- */

const shaftVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const shaftFragment = /* glsl */ `
  uniform float uTime;
  uniform float uDark;
  uniform float uSeed;
  varying vec2 vUv;
  float beam(vec2 uv, float x, float w) {
    float d = uv.x - x - (1.0 - uv.y) * 0.32;
    return exp(-d * d / (w * w));
  }
  void main() {
    float t = uTime * 0.05 + uSeed * 10.0;
    float b = beam(vUv, 0.42 + 0.05 * sin(t), 0.08) * (0.65 + 0.35 * sin(t * 1.3))
            + beam(vUv, 0.6 + 0.04 * cos(t * 0.8), 0.05) * (0.5 + 0.5 * sin(t * 0.9 + 1.7));
    // Fall off toward the bottom and soften every edge of the quad.
    float fall = smoothstep(0.0, 0.85, vUv.y) * smoothstep(1.0, 0.72, vUv.y)
               * smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
    vec3 darkCol = vec3(0.45, 0.85, 0.95);
    vec3 lightCol = vec3(0.62, 0.86, 0.98);
    float a = b * fall * mix(0.28, 0.16, uDark);
    gl_FragColor = vec4(mix(lightCol, darkCol, uDark), a);
  }
`;

/* ------------------------------ Silk ribbons ---------------------------- */

const silkVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uAmp;
  varying vec2 vUv;
  varying vec3 vViewPos;
  varying vec3 vNormalV;
  varying vec3 vTangentV;
  vec3 shape(vec3 p) {
    float t = uTime * 0.055 + uSeed * 6.283;
    vec3 q = p;
    q.y += sin(q.x * 0.26 + t) * 0.95 + sin(q.x * 0.1 - t * 0.6) * 0.7;
    q.z += (sin(q.x * 0.38 + t * 1.25) * 0.55 + sin(q.x * 0.82 - p.y * 0.7 + t * 0.85) * 0.22) * uAmp;
    // A slow twist along the length lets light roll across the fabric.
    float tw = sin(q.x * 0.16 + t * 0.45) * 0.75;
    q.z += p.y * sin(tw) * 0.55;
    q.y += p.y * (cos(tw) - 1.0) * 0.55;
    return q;
  }
  void main() {
    vUv = uv;
    vec3 p = shape(position);
    // Smooth analytic normal from the deformation itself (no faceting).
    vec3 dx = shape(position + vec3(0.03, 0.0, 0.0)) - p;
    vec3 dy = shape(position + vec3(0.0, 0.03, 0.0)) - p;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vViewPos = mv.xyz;
    vNormalV = normalize(normalMatrix * normalize(cross(dx, dy)));
    vTangentV = normalize(normalMatrix * normalize(dx));
    gl_Position = projectionMatrix * mv;
  }
`;

const silkFragment = /* glsl */ `
  uniform float uTime;
  uniform float uDark;
  uniform float uSeed;
  uniform float uOpacity;
  uniform float uRtl;
  uniform vec2 uResolution;
  uniform vec3 uDeepD; uniform vec3 uMidD; uniform vec3 uEdgeD;
  uniform vec3 uDeepL; uniform vec3 uMidL; uniform vec3 uEdgeL;
  varying vec2 vUv;
  varying vec3 vViewPos;
  varying vec3 vNormalV;
  varying vec3 vTangentV;
  float kajiya(vec3 T, vec3 H, float power) {
    float th = dot(T, H);
    return pow(sqrt(max(0.0, 1.0 - th * th)), power);
  }
  void main() {
    vec3 N = normalize(vNormalV);
    if (!gl_FrontFacing) N = -N;
    vec3 V = normalize(-vViewPos);
    vec3 T = normalize(vTangentV);
    vec3 key = normalize(vec3(-0.45, 0.75, 0.55));
    vec3 rim = normalize(vec3(0.55, -0.15, -0.8));
    float diff = clamp(dot(N, key) * 0.5 + 0.5, 0.0, 1.0);
    // Satin: anisotropic highlight stretched along the ribbon's length.
    float sheen = kajiya(T, normalize(key + V), 70.0);
    float sheenSoft = kajiya(T, normalize(rim + V), 18.0);
    float fres = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 3.0);

    float w = vUv.y;
    float l = vUv.x + 0.12 * sin(uTime * 0.04 + uSeed * 4.0);
    vec3 deep = mix(uDeepL, uDeepD, uDark);
    vec3 mid = mix(uMidL, uMidD, uDark);
    vec3 edge = mix(uEdgeL, uEdgeD, uDark);
    vec3 base = mix(deep, mid, smoothstep(0.1, 0.9, l));
    base = mix(base, edge, smoothstep(0.6, 1.0, w) * 0.55);

    vec3 col = base * mix(0.55 + 0.6 * diff, 0.28 + 0.8 * diff, uDark);
    col += sheen * mix(vec3(1.0), vec3(0.72, 0.93, 1.0), uDark) * mix(0.55, 0.75, uDark);
    col += sheenSoft * mid * 0.35 + fres * edge * 0.35;

    float band = smoothstep(0.0, 0.26, w) * smoothstep(1.0, 0.74, w);
    float ends = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
    // Keep the copy column calm (mirrored for right-to-left layouts).
    float side = uRtl > 0.5 ? 1.0 - gl_FragCoord.x / uResolution.x : gl_FragCoord.x / uResolution.x;
    float copy = mix(0.4, 1.0, smoothstep(0.15, 0.55, side));
    float alpha = band * ends * copy * uOpacity * mix(1.3, 1.0, uDark) * (0.55 + 0.35 * diff + 0.3 * sheen);
    gl_FragColor = vec4(col, alpha);
  }
`;

/* --------------------------------- Dust --------------------------------- */

const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixel;
  attribute float aSeed;
  varying float vFade;
  void main() {
    vec3 p = position;
    // Slow upward drift that wraps seamlessly (faded at both ends).
    float span = 9.0;
    float y = mod(p.y + uTime * (0.05 + aSeed * 0.05) + span * 0.5, span) - span * 0.5;
    p.y = y;
    p.x += sin(uTime * 0.1 + aSeed * 30.0) * 0.25;
    vFade = smoothstep(span * 0.5, span * 0.3, abs(y)) * (0.5 + 0.5 * sin(uTime * 0.4 + aSeed * 50.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uPixel * (2.0 + aSeed * 3.0) * (8.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const dustFragment = /* glsl */ `
  uniform float uDark;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    vec3 col = mix(vec3(0.23, 0.51, 0.96), vec3(0.65, 0.95, 0.95), uDark);
    gl_FragColor = vec4(col, a * vFade * mix(0.18, 0.32, uDark));
  }
`;

/* ------------------------------- Helpers -------------------------------- */

interface Signals {
  scroll: number;
  dark: number;
  time: number;
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function readDark() {
  const theme = document.documentElement.dataset.theme;
  if (theme === "dark") return 1;
  if (theme === "light") return 0;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? 1 : 0;
}

const silkPalettes = [
  // [deep, mid, edge] for dark then light themes (sRGB, written as authored).
  {
    dark: ["#0d2a6b", "#0f766e", "#5eead4"],
    light: ["#60a5fa", "#5eead4", "#a5b4fc"],
  },
  {
    dark: ["#13306e", "#1d4ed8", "#38bdf8"],
    light: ["#93c5fd", "#67e8f9", "#c4b5fd"],
  },
  {
    dark: ["#0b3a46", "#14b8a6", "#a7f3d0"],
    light: ["#6ee7b7", "#7dd3fc", "#c7d2fe"],
  },
] as const;

/** Hex to a raw sRGB vector: the shaders output colours as authored. */
function srgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/* ------------------------------- Layers --------------------------------- */

function Backdrop({ signals }: { signals: React.RefObject<Signals> }) {
  const res = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: backdropVertex,
      fragmentShader: backdropFragment,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uDark: { value: 0 },
        uScroll: { value: 0 },
        uAspect: { value: new THREE.Vector2(1, 1) },
      },
    });
    return { geometry, material };
  }, []);
  const live = useRef(res);
  useEffect(() => {
    live.current = res;
    return () => {
      res.geometry.dispose();
      res.material.dispose();
    };
  }, [res]);
  useFrame((state) => {
    const s = signals.current;
    const u = live.current.material.uniforms;
    if (!s) return;
    u.uTime.value = s.time;
    u.uDark.value = s.dark;
    u.uScroll.value = s.scroll;
    const a = state.size.width / Math.max(state.size.height, 1);
    (u.uAspect.value as THREE.Vector2).set(Math.max(a, 1), Math.max(1 / a, 1));
  });
  return (
    <mesh
      geometry={res.geometry}
      material={res.material}
      frustumCulled={false}
      renderOrder={-10}
    />
  );
}

function Shafts({ signals }: { signals: React.RefObject<Signals> }) {
  const res = useMemo(() => {
    // Oversized so the quad edges never enter the frame.
    const geometry = new THREE.PlaneGeometry(26, 16);
    const make = (seed: number) =>
      new THREE.ShaderMaterial({
        vertexShader: shaftVertex,
        fragmentShader: shaftFragment,
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 }, uDark: { value: 0 }, uSeed: { value: seed } },
      });
    return { geometry, materials: [make(0.2), make(0.75)] };
  }, []);
  const live = useRef(res);
  useEffect(() => {
    live.current = res;
    return () => {
      res.geometry.dispose();
      res.materials.forEach((m) => m.dispose());
    };
  }, [res]);
  useFrame(() => {
    const s = signals.current;
    if (!s) return;
    live.current.materials[0].uniforms.uTime.value = s.time;
    live.current.materials[0].uniforms.uDark.value = s.dark;
    live.current.materials[1].uniforms.uTime.value = s.time;
    live.current.materials[1].uniforms.uDark.value = s.dark;
  });
  return (
    <>
      <mesh
        geometry={res.geometry}
        material={res.materials[0]}
        position={[1.5, 1.2, -5]}
        rotation={[0, 0, -0.18]}
        renderOrder={-5}
      />
      <mesh
        geometry={res.geometry}
        material={res.materials[1]}
        position={[-3.5, 0.6, -6]}
        rotation={[0, 0, 0.12]}
        renderOrder={-5}
      />
    </>
  );
}

function Silk({
  signals,
  seed,
  palette,
  opacity,
  amp,
  segments,
  position,
  rotation,
  width,
}: {
  signals: React.RefObject<Signals>;
  seed: number;
  palette: (typeof silkPalettes)[number];
  opacity: number;
  amp: number;
  segments: [number, number];
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
}) {
  const res = useMemo(() => {
    // Long enough that the tapered ends stay outside the viewport.
    const geometry = new THREE.PlaneGeometry(28, width, segments[0], segments[1]);
    const material = new THREE.ShaderMaterial({
      vertexShader: silkVertex,
      fragmentShader: silkFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uSeed: { value: seed },
        uAmp: { value: amp },
        uDark: { value: 0 },
        uOpacity: { value: opacity },
        uRtl: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uDeepD: { value: srgb(palette.dark[0]) },
        uMidD: { value: srgb(palette.dark[1]) },
        uEdgeD: { value: srgb(palette.dark[2]) },
        uDeepL: { value: srgb(palette.light[0]) },
        uMidL: { value: srgb(palette.light[1]) },
        uEdgeL: { value: srgb(palette.light[2]) },
      },
    });
    return { geometry, material };
  }, [seed, palette, opacity, amp, segments, width]);
  const live = useRef(res);
  useEffect(() => {
    live.current = res;
    return () => {
      res.geometry.dispose();
      res.material.dispose();
    };
  }, [res]);
  useFrame((state) => {
    const s = signals.current;
    const u = live.current.material.uniforms;
    if (!s) return;
    u.uTime.value = s.time;
    u.uDark.value = s.dark;
    u.uRtl.value = document.documentElement.dir === "rtl" ? 1 : 0;
    state.gl.getDrawingBufferSize(u.uResolution.value as THREE.Vector2);
  });
  return (
    <mesh
      geometry={res.geometry}
      material={res.material}
      position={position}
      rotation={rotation}
      frustumCulled={false}
    />
  );
}

function Dust({ signals, count }: { signals: React.RefObject<Signals>; count: number }) {
  const gl = useThree((s) => s.gl);
  const res = useMemo(() => {
    const random = rng(97);
    const pos = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos.set([(random() - 0.5) * 18, (random() - 0.5) * 9, -1 - random() * 6], i * 3);
      seeds[i] = random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uDark: { value: 0 },
        uPixel: { value: Math.min(gl.getPixelRatio(), 2) },
      },
    });
    return { geometry, material };
  }, [count, gl]);
  const live = useRef(res);
  useEffect(() => {
    live.current = res;
    return () => {
      res.geometry.dispose();
      res.material.dispose();
    };
  }, [res]);
  useFrame(() => {
    const s = signals.current;
    if (!s) return;
    live.current.material.uniforms.uTime.value = s.time;
    live.current.material.uniforms.uDark.value = s.dark;
  });
  return <points geometry={res.geometry} material={res.material} frustumCulled={false} />;
}

/* ------------------------------ Composition ----------------------------- */

function SceneContent({ tier, reduced }: { tier: RenderTier; reduced: boolean }) {
  // A fixed seed time gives reduced-motion users one composed, still frame.
  const signals = useRef<Signals>({ scroll: 0, dark: 0, time: 42 });
  const target = useRef({ dark: 0 });
  const rig = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const setFrameloop = useThree((s) => s.setFrameloop);

  useEffect(() => {
    target.current.dark = readDark();
    signals.current.dark = target.current.dark;
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
    // Stop rendering entirely while the tab is hidden.
    const onVisibility = () => {
      if (document.hidden) setFrameloop("never");
      else {
        setFrameloop(reduced ? "demand" : "always");
        invalidate();
      }
    };
    const observer = new MutationObserver(onTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "dir"],
    });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", onTheme);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    onScroll();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", onTheme);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced, invalidate, setFrameloop]);

  useFrame((_, dt) => {
    const s = signals.current;
    const step = Math.min(dt, 0.05);
    if (!reduced) s.time += step;
    s.dark += (target.current.dark - s.dark) * (reduced ? 1 : 1 - Math.exp(-step * 4));
    // The set breathes slowly on its own and sinks a little as the page
    // scrolls. There is no pointer input at all.
    const g = rig.current;
    if (g) {
      g.rotation.z = Math.sin(s.time * 0.03) * 0.02;
      g.position.y = s.scroll * 1.4 + Math.sin(s.time * 0.05) * 0.08;
    }
  });

  const high = tier === "high";
  return (
    <>
      <Backdrop signals={signals} />
      <Shafts signals={signals} />
      <group ref={rig}>
        <Silk
          signals={signals}
          seed={0.1}
          palette={silkPalettes[1]}
          opacity={0.42}
          amp={0.8}
          width={3.2}
          segments={high ? [200, 36] : [110, 20]}
          position={[1.5, -1.6, -3.2]}
          rotation={[-0.3, 0.12, -0.12]}
        />
        <Silk
          signals={signals}
          seed={0.45}
          palette={silkPalettes[0]}
          opacity={0.62}
          amp={1}
          width={3.6}
          segments={high ? [240, 40] : [130, 22]}
          position={[0.6, 0.4, -1.2]}
          rotation={[-0.25, 0.08, -0.24]}
        />
        <Silk
          signals={signals}
          seed={0.8}
          palette={silkPalettes[2]}
          opacity={0.36}
          amp={0.7}
          width={2.4}
          segments={high ? [180, 30] : [100, 18]}
          position={[2.4, 2.6, -2.4]}
          rotation={[-0.2, -0.1, -0.06]}
        />
        <Dust signals={signals} count={high ? 140 : 70} />
      </group>
    </>
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
      gl={{ antialias: high, alpha: false, powerPreference: "low-power" }}
      aria-hidden="true"
    >
      <SceneContent tier={tier} reduced={reduced} />
    </Canvas>
  );
}
