"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, PerformanceMonitor } from "@react-three/drei";
import type { MotionValue } from "motion/react";
import type { Locale } from "@/components/providers";
import {
  Device,
  restingState,
  type DeviceAnchors,
  type DeviceState,
} from "./device-model";
import type { ScreenStage } from "./textures";
import type { RenderTier } from "./capabilities";
import {
  Studio,
  configureRenderer,
  damp,
  smoothstep,
} from "./studio";

type Key = readonly [at: number, value: number];

/** Piecewise interpolation with eased segments between keyframes. */
function sample(keys: readonly Key[], p: number) {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (p <= t1) {
      const [t0, v0] = keys[i - 1];
      return v0 + (v1 - v0) * smoothstep(t0, t1, p);
    }
  }
  return keys[keys.length - 1][1];
}

const TAU = Math.PI * 2;
// Choreography: intake → diagnosis (x-ray scan from the back) → exploded
// view → connected operations → reassembly → ready for pickup.
const T = {
  rotY: [
    [0, -0.45],
    [0.12, -0.45],
    [0.26, Math.PI - 0.45],
    [0.34, Math.PI - 0.45],
    [0.4, TAU - 0.95],
    [0.72, TAU - 0.92],
    [0.85, TAU - 0.35],
    [1, TAU - 0.3],
  ],
  rotX: [
    [0, 0.06],
    [0.12, 0.06],
    [0.26, 0.03],
    [0.34, 0.03],
    [0.4, 0.38],
    [0.72, 0.38],
    [0.85, 0.06],
    [1, 0.05],
  ],
  // Separation starts only after the turn into the three-quarter view.
  explode: [
    [0.4, 0],
    [0.52, 1],
    [0.72, 1],
    [0.84, 0],
  ],
  // X-ray fades in once the back faces the camera.
  xray: [
    [0.2, 0],
    [0.25, 1],
    [0.33, 1],
    [0.38, 0],
  ],
  scanOpacity: [
    [0.235, 0],
    [0.25, 1],
    [0.315, 1],
    [0.335, 0],
  ],
  highlight: [
    [0.28, 0],
    [0.31, 1],
    [0.37, 1],
    [0.41, 0],
  ],
  connect: [
    [0.52, 0],
    [0.57, 1],
    [0.69, 1],
    [0.73, 0],
  ],
} satisfies Record<string, readonly Key[]>;

interface Connection {
  anchor: keyof DeviceAnchors;
  /** Attachment point in the anchor part's local space. */
  at: readonly [number, number, number];
  label: readonly [string, string];
}

// First three sit in the inline-start column, last three in the inline-end
// column, so the layout mirrors with the document direction.
const CONNECTIONS: readonly Connection[] = [
  // Start column: front layers (display, logic board) face this side.
  { anchor: "board", at: [-0.12, 0.42, 0.03], label: ["Technician", "الفني"] },
  { anchor: "display", at: [0, 0.05, 0.05], label: ["Customer", "العميل"] },
  { anchor: "display", at: [0, -0.5, 0.05], label: ["Approval", "الموافقة"] },
  // End column: rear layers (frame, battery, back glass) face this side.
  { anchor: "frame", at: [0.3, 0.62, 0], label: ["Diagnosis", "التشخيص"] },
  { anchor: "battery", at: [0, 0.05, -0.03], label: ["Spare parts", "قطع الغيار"] },
  { anchor: "back", at: [0, -0.45, -0.035], label: ["Reports", "التقارير"] },
];

const SEGMENTS = 32;

/** Pixel geometry of the label overlay, measured from the real DOM. */
interface StoryLayout {
  width: number;
  height: number;
  /** Centre of each label's dot, relative to the canvas box. */
  dots: Array<{ x: number; y: number }>;
  /** Area the device may occupy without touching any label. */
  safe: { left: number; top: number; right: number; bottom: number };
}

const emptyLayout = (): StoryLayout => ({
  width: 0,
  height: 0,
  dots: [],
  safe: { left: 0, top: 0, right: 0, bottom: 0 },
});

function Connections({
  amountRef,
  anchorsRef,
  layoutRef,
}: {
  amountRef: React.RefObject<number>;
  anchorsRef: React.RefObject<DeviceAnchors>;
  layoutRef: React.RefObject<StoryLayout>;
}) {
  const group = useRef<THREE.Group>(null);

  const parts = useMemo(() => {
    const material = new THREE.LineBasicMaterial({
      color: "#2dd4bf",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    });
    const pulse = new THREE.MeshBasicMaterial({
      color: "#a7f3d0",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    });
    const lines = CONNECTIONS.map(() => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(SEGMENTS * 3), 3),
      );
      const line = new THREE.Line(geometry, material);
      line.frustumCulled = false;
      return line;
    });
    const sphere = new THREE.SphereGeometry(1, 16, 12);
    return { material, pulse, lines, sphere };
  }, []);

  useEffect(
    () => () => {
      parts.lines.forEach((l) => l.geometry.dispose());
      parts.sphere.dispose();
      parts.material.dispose();
      parts.pulse.dispose();
    },
    [parts],
  );

  const live = useRef(parts);
  useEffect(() => {
    live.current = parts;
  }, [parts]);
  const pulses = useRef<Array<THREE.Mesh | null>>([]);
  const tmp = useMemo(
    () => ({
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      c: new THREE.Vector3(),
      p: new THREE.Vector3(),
      curve: new THREE.QuadraticBezierCurve3(),
    }),
    [],
  );

  useFrame((state) => {
    const amount = amountRef.current ?? 0;
    const visible = amount > 0.002;
    if (group.current) group.current.visible = visible;
    const layout = layoutRef.current;
    // Compact stages show the labels as a legend without connector lines:
    // six lines fanning into one row of chips would cross the device.
    if (group.current && layout && layout.width < WIDE_STAGE)
      group.current.visible = false;
    if (!visible || !layout || layout.width < WIDE_STAGE) return;
    if (layout.dots.length !== CONNECTIONS.length) return;
    const parts = live.current;
    parts.material.opacity = amount * 0.8;
    parts.pulse.opacity = amount;
    const { size, viewport } = state;
    // World units per CSS pixel on the z = 0 plane the camera looks at.
    const wpp = viewport.height / size.height;
    const time = state.clock.elapsedTime;
    // Labels fade first; lines grow out of them once they are visible.
    const reach = smoothstep(0.3, 1, amount);
    CONNECTIONS.forEach((c, i) => {
      const anchor = anchorsRef.current?.[c.anchor];
      const dot = layout.dots[i];
      if (!anchor || !dot) return;
      anchor.localToWorld(tmp.a.set(c.at[0], c.at[1], c.at[2]));
      tmp.b.set(
        (dot.x - size.width / 2) * wpp,
        -(dot.y - size.height / 2) * wpp,
        0,
      );
      tmp.c.copy(tmp.a).lerp(tmp.b, 0.55);
      tmp.c.z += 0.45;
      tmp.curve.v0.copy(tmp.a);
      tmp.curve.v1.copy(tmp.c);
      tmp.curve.v2.copy(tmp.b);
      const attr = parts.lines[i].geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      for (let s = 0; s < SEGMENTS; s++) {
        tmp.curve.getPoint((s / (SEGMENTS - 1)) * reach, tmp.p);
        attr.setXYZ(s, tmp.p.x, tmp.p.y, tmp.p.z);
      }
      attr.needsUpdate = true;
      const pulse = pulses.current[i];
      if (pulse) {
        tmp.curve.getPoint(((time * 0.2 + i * 0.17) % 1) * reach, tmp.p);
        pulse.position.copy(tmp.p);
      }
    });
  });

  return (
    <group ref={group} visible={false}>
      {parts.lines.map((line, i) => (
        <primitive key={`line-${i}`} object={line} />
      ))}
      {CONNECTIONS.map((c, i) => (
        <mesh
          key={c.label[0]}
          ref={(m) => {
            pulses.current[i] = m;
          }}
          geometry={parts.sphere}
          material={parts.pulse}
          scale={0.016}
        />
      ))}
    </group>
  );
}

function StoryRig({
  progress,
  reducedMotion,
  mirror,
  stateRef,
  connectRef,
  layoutRef,
  children,
  shadow,
}: {
  progress: MotionValue<number>;
  reducedMotion: boolean;
  mirror: boolean;
  stateRef: React.RefObject<DeviceState>;
  connectRef: React.RefObject<number>;
  layoutRef: React.RefObject<StoryLayout>;
  children: React.ReactNode;
  shadow: React.ReactNode;
}) {
  const frame = useRef<THREE.Group>(null);
  const pose = useRef<THREE.Group>(null);
  const center = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const dir = mirror ? -1 : 1;

  // With reduced motion the loop renders on demand, driven only by scrolling.
  useEffect(() => {
    if (!reducedMotion) return;
    return progress.on("change", () => invalidate());
  }, [progress, reducedMotion, invalidate]);

  useFrame((state, dt) => {
    const p = progress.get();
    const st = stateRef.current;
    const g = pose.current;
    const f = frame.current;
    if (!st || !g || !f) return;
    const delta = Math.min(dt, 1 / 20);
    const ease = (cur: number, target: number, lambda = 5) =>
      reducedMotion ? target : damp(cur, target, lambda, delta);

    st.explode = ease(st.explode, sample(T.explode, p), 4.5);
    st.xray = ease(st.xray, sample(T.xray, p), 6);
    st.scan = THREE.MathUtils.clamp((p - 0.245) / 0.075, 0, 1);
    st.scanOpacity = ease(st.scanOpacity, sample(T.scanOpacity, p), 10);
    st.highlight = ease(st.highlight, sample(T.highlight, p), 6);
    // Completes by 0.95, leaving a calm hold on the finished state.
    st.success = smoothstep(0.88, 0.95, p);
    connectRef.current = ease(connectRef.current ?? 0, sample(T.connect, p), 6);

    // In RTL the whole choreography is mirrored so the device faces the copy.
    g.rotation.y = ease(g.rotation.y, dir * sample(T.rotY, p), 4.2);
    g.rotation.x = ease(g.rotation.x, sample(T.rotX, p), 4.2);
    if (center.current) center.current.position.z = st.explode * 0.09;

    // Responsive framing: fit the device into the measured safe area.
    const L = layoutRef.current;
    const { size, viewport } = state;
    if (L && L.width > 0) {
      const wpp = viewport.height / size.height;
      const e = st.explode;
      const pad = 20;
      // Labels only claim space while the stack is exploded.
      const mix = (a: number, b: number) => a + (b - a) * e;
      const left = mix(pad, L.safe.left);
      const right = mix(size.width - pad, L.safe.right);
      const top = mix(pad, L.safe.top);
      const bottom = mix(size.height - pad, L.safe.bottom);
      const safeW = Math.max(right - left, 40) * wpp;
      const safeH = Math.max(bottom - top, 40) * wpp;
      // Projected extents of the device at scale 1, assembled vs exploded.
      const reqW = mix(1.5, 2.9);
      const reqH = mix(2.85, 3.1);
      const fit = Math.min(1.1, safeW / reqW, safeH / reqH);
      const cx = ((left + right) / 2 - size.width / 2) * wpp;
      const cy = -((top + bottom) / 2 - size.height / 2) * wpp;
      f.position.x = ease(f.position.x, cx, 5);
      f.position.y = ease(f.position.y, cy, 5);
      f.scale.setScalar(ease(f.scale.x, fit, 5));
    }
  });

  return (
    <group ref={frame}>
      <group ref={pose} rotation={[0.06, dir * -0.45, 0]}>
        <group ref={center}>{children}</group>
      </group>
      {shadow}
    </group>
  );
}

interface StorySceneProps {
  progress: MotionValue<number>;
  screenStage: ScreenStage;
  language: Locale;
  active: boolean;
  reducedMotion: boolean;
  tier: RenderTier;
}

/** Label columns are used when the stage is at least this wide (CSS px). */
const WIDE_STAGE = 640;

export default function StoryScene({
  progress,
  screenStage,
  language,
  active,
  reducedMotion,
  tier,
}: StorySceneProps) {
  const stateRef = useRef<DeviceState>(restingState());
  const connectRef = useRef(0);
  const layoutRef = useRef<StoryLayout>(emptyLayout());
  const wrapRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLOListElement>(null);
  const dotRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const chipRefs = useRef<Array<HTMLLIElement | null>>([]);
  const anchorsRef = useRef<DeviceAnchors>({
    display: null,
    board: null,
    battery: null,
    frame: null,
    back: null,
  });
  const [dpr, setDpr] = useState<number>(tier === "high" ? 1.75 : 1.25);
  const [shadows, setShadows] = useState(tier === "high");
  const [layout, setLayout] = useState<"wide" | "compact">("wide");

  // Measure label positions from the rendered DOM whenever anything resizes.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const base = wrap.getBoundingClientRect();
      if (base.width === 0) return;
      const nextLayout = base.width >= WIDE_STAGE ? "wide" : "compact";
      setLayout((prev) => (prev === nextLayout ? prev : nextLayout));
      const dots = dotRefs.current.map((d) => {
        const r = d?.getBoundingClientRect();
        return r
          ? {
              x: r.left + r.width / 2 - base.left,
              y: r.top + r.height / 2 - base.top,
            }
          : { x: base.width / 2, y: base.height / 2 };
      });
      const chips = chipRefs.current
        .map((c) => c?.getBoundingClientRect())
        .filter((r): r is DOMRect => Boolean(r));
      const gap = 28;
      let safe = {
        left: gap,
        top: gap,
        right: base.width - gap,
        bottom: base.height - gap,
      };
      if (nextLayout === "wide") {
        // Columns: keep the device between the inner edges of both columns.
        for (const r of chips) {
          const l = r.left - base.left;
          const rr = r.right - base.left;
          if (l + r.width / 2 < base.width / 2)
            safe.left = Math.max(safe.left, rr + gap);
          else safe.right = Math.min(safe.right, l - gap);
        }
      } else {
        // Compact rows along the bottom: keep the device above them.
        for (const r of chips)
          safe.bottom = Math.min(safe.bottom, r.top - base.top - 12);
      }
      if (safe.right - safe.left < 80)
        safe = { ...safe, left: gap, right: base.width - gap };
      layoutRef.current = { width: base.width, height: base.height, dots, safe };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    chipRefs.current.forEach((c) => c && ro.observe(c));
    void document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [language, layout]);

  // Labels fade with the connected-operations stage (no per-frame React work).
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = () => {
      const el = labelsRef.current;
      if (el) {
        const a = connectRef.current;
        el.style.opacity = String(a);
        el.style.visibility = a > 0.002 ? "visible" : "hidden";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <div ref={wrapRef} className="story-canvas" data-layout={layout}>
      <Canvas
        className="device-canvas"
        dpr={dpr}
        frameloop={!active ? "never" : reducedMotion ? "demand" : "always"}
        camera={{ position: [0, 0, 7.2], fov: 30 }}
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
        <StoryRig
          progress={progress}
          reducedMotion={reducedMotion}
          mirror={language === "ar"}
          stateRef={stateRef}
          connectRef={connectRef}
          layoutRef={layoutRef}
          shadow={
            shadows ? (
              <ContactShadows
                position={[0, -1.62, 0]}
                opacity={0.28}
                scale={6}
                blur={2.8}
                far={3}
                resolution={512}
                color="#1e3a8a"
              />
            ) : null
          }
        >
          <group scale={1.7}>
            <Device
              stateRef={stateRef}
              screenStage={screenStage}
              language={language}
              detail={tier}
              anchorsRef={anchorsRef}
            />
          </group>
        </StoryRig>
        <Connections
          amountRef={connectRef}
          anchorsRef={anchorsRef}
          layoutRef={layoutRef}
        />
      </Canvas>
      <ol
        ref={labelsRef}
        className="story-labels"
        aria-hidden="true"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        {CONNECTIONS.map((c, i) => (
          <li
            key={c.label[0]}
            ref={(el) => {
              chipRefs.current[i] = el;
            }}
            className="story-node"
            data-column={i < 3 ? "start" : "end"}
          >
            <span
              className="story-dot"
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
            />
            <span>{language === "ar" ? c.label[1] : c.label[0]}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
