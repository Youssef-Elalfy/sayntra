"use client";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { Locale } from "@/components/providers";
import {
  createBackTexture,
  createBatteryTexture,
  createCoilTexture,
  createScanTexture,
  createScreenTexture,
  drawScreen,
  type ScreenStage,
} from "./textures";

/** Physical proportions in decimetres (72 x 150 x 7.8 mm handset). */
export const PHONE = { W: 0.72, H: 1.5, D: 0.078, R: 0.105 } as const;

/** Animated state written by a scene each frame and read by the model. */
export interface DeviceState {
  /** 0 = assembled, 1 = fully exploded along the stacking axis. */
  explode: number;
  /** 0 = opaque back glass, 1 = diagnostic x-ray view of the internals. */
  xray: number;
  /** Scan band position 0..1 from top to bottom. */
  scan: number;
  /** Visibility of the scan band. */
  scanOpacity: number;
  /** Battery fault highlight intensity. */
  highlight: number;
  /** Completion pulse progress 0..1. */
  success: number;
}

export const restingState = (): DeviceState => ({
  explode: 0,
  xray: 0,
  scan: 0,
  scanOpacity: 0,
  highlight: 0,
  success: 0,
});

/** Parts that scenes may anchor overlays to. */
export interface DeviceAnchors {
  display: THREE.Object3D | null;
  board: THREE.Object3D | null;
  battery: THREE.Object3D | null;
  frame: THREE.Object3D | null;
  back: THREE.Object3D | null;
}

function roundedRectShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** Remaps planar UVs to 0..1 across the geometry's XY bounds. */
function planarUVs(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const pos = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  if (!box || !uv) return geometry;
  const w = box.max.x - box.min.x;
  const h = box.max.y - box.min.y;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - box.min.x) / w, (pos.getY(i) - box.min.y) / h);
  }
  uv.needsUpdate = true;
  return geometry;
}

function slab(w: number, h: number, r: number, depth: number, bevel: number) {
  const g = new THREE.ExtrudeGeometry(
    roundedRectShape(w - bevel * 2, h - bevel * 2, Math.max(r - bevel, 0.005)),
    {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 5,
      curveSegments: 36,
    },
  );
  g.translate(0, 0, -depth / 2);
  return planarUVs(g);
}

/** Deterministic pseudo-random generator so component layouts are stable. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface DeviceProps {
  stateRef: RefObject<DeviceState>;
  screenStage: ScreenStage;
  language: Locale;
  detail?: "high" | "balanced";
  anchorsRef?: RefObject<DeviceAnchors>;
}

const { W, H, D, R } = PHONE;
const FRAME_BEVEL = 0.009;
const FRAME_DEPTH = D - FRAME_BEVEL * 2 - 0.012;
const FRONT_Z = FRAME_DEPTH / 2 + FRAME_BEVEL; // frame front face
const GLASS_T = 0.004;
const GLASS_BEVEL = 0.0028;
const GLASS_INSET = 0.012;
const CAMERA = { x: 0.165, y: 0.555 } as const;
const LENSES: ReadonlyArray<readonly [number, number]> = [
  [0.056, 0.056],
  [0.056, -0.058],
  [-0.058, 0],
];

export function Device({
  stateRef,
  screenStage,
  language,
  detail = "high",
  anchorsRef,
}: DeviceProps) {
  const displayRef = useRef<THREE.Group>(null);
  const boardRef = useRef<THREE.Group>(null);
  const batteryRef = useRef<THREE.Group>(null);
  const coilRef = useRef<THREE.Group>(null);
  const backRef = useRef<THREE.Group>(null);
  const frameRef = useRef<THREE.Group>(null);
  const internalsRef = useRef<THREE.Group>(null);
  const scanRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // ---------- Geometry ----------
  const geo = useMemo(() => {
    const outer = roundedRectShape(
      W - FRAME_BEVEL * 2,
      H - FRAME_BEVEL * 2,
      R - FRAME_BEVEL,
    );
    const lip = 0.022;
    outer.holes.push(
      roundedRectShape(
        W - FRAME_BEVEL * 2 - lip * 2,
        H - FRAME_BEVEL * 2 - lip * 2,
        R - FRAME_BEVEL - lip,
      ),
    );
    const frame = new THREE.ExtrudeGeometry(outer, {
      depth: FRAME_DEPTH,
      bevelEnabled: true,
      bevelThickness: FRAME_BEVEL,
      bevelSize: FRAME_BEVEL,
      bevelSegments: 8,
      curveSegments: 40,
    });
    frame.translate(0, 0, -FRAME_DEPTH / 2);
    const gw = W - GLASS_INSET;
    const gh = H - GLASS_INSET;
    const glass = slab(gw, gh, R - GLASS_INSET / 2, GLASS_T, GLASS_BEVEL);
    const bezel = 0.017;
    const screen = planarUVs(
      new THREE.ShapeGeometry(
        roundedRectShape(gw - bezel * 2, gh - bezel * 2, R - 0.03),
        36,
      ),
    );
    const plateau = slab(0.31, 0.31, 0.075, 0.008, 0.004);
    const pcbShape = roundedRectShape(0.6, 0.46, 0.035);
    const pcb = new THREE.ExtrudeGeometry(pcbShape, {
      depth: 0.008,
      bevelEnabled: false,
      curveSegments: 12,
    });
    pcb.translate(0, 0, -0.004);
    const midplate = new THREE.ShapeGeometry(
      roundedRectShape(W - 0.06, H - 0.06, R - 0.03),
      24,
    );
    const ring = new THREE.TorusGeometry(1, 0.0045, 8, 160);
    const scanPlane = new THREE.PlaneGeometry(W * 1.25, 0.42);
    const coil = new THREE.CircleGeometry(0.23, 64);
    return { frame, glass, screen, plateau, pcb, midplate, ring, scanPlane, coil };
  }, []);

  // ---------- Textures ----------
  const screen = useMemo(() => createScreenTexture(), []);
  const tex = useMemo(
    () => ({
      battery: createBatteryTexture(),
      coil: createCoilTexture(),
      back: createBackTexture(),
      scan: createScanTexture(),
    }),
    [],
  );


  // ---------- Materials ----------
  const mat = useMemo(() => {
    const frame = new THREE.MeshPhysicalMaterial({
      color: "#6f84ab",
      metalness: 1,
      roughness: 0.16,
      clearcoat: 0.6,
      clearcoatRoughness: 0.12,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: "#05070c",
      roughness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      ior: 1.52,
    });
    const screenMat = new THREE.MeshPhysicalMaterial({
      color: "#000000",
      emissive: "#ffffff",
      emissiveMap: screen.texture,
      emissiveIntensity: 1.05,
      // The cover glass above carries the reflection; no second lobe here.
      roughness: 0.07,
    });
    const back = new THREE.MeshPhysicalMaterial({
      color: "#2a3b60",
      roughness: 0.48,
      roughnessMap: tex.back,
      metalness: 0.25,
      clearcoat: 0.8,
      clearcoatRoughness: 0.12,
    });
    const plateau = new THREE.MeshPhysicalMaterial({
      color: "#243659",
      roughness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
    });
    const lensRing = new THREE.MeshPhysicalMaterial({
      color: "#8f9db3",
      metalness: 1,
      roughness: 0.18,
    });
    const lensGlass = new THREE.MeshPhysicalMaterial({
      color: "#03050b",
      roughness: 0.02,
      clearcoat: 1,
      iridescence: 1,
      iridescenceIOR: 1.7,
      iridescenceThicknessMinimum: 220,
      iridescenceThicknessMaximum: 520,
    });
    const lensInner = new THREE.MeshPhysicalMaterial({
      color: "#1c2f63",
      metalness: 0.85,
      roughness: 0.14,
    });
    const flash = new THREE.MeshStandardMaterial({
      color: "#f3ead2",
      roughness: 0.25,
      emissive: "#fff3d6",
      emissiveIntensity: 0.15,
    });
    const pcb = new THREE.MeshPhysicalMaterial({
      color: "#0f3a3c",
      roughness: 0.55,
      clearcoat: 0.45,
      clearcoatRoughness: 0.35,
    });
    const shield = new THREE.MeshStandardMaterial({
      color: "#c8ced8",
      metalness: 1,
      roughness: 0.36,
    });
    const chip = new THREE.MeshStandardMaterial({
      color: "#12151b",
      roughness: 0.42,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: "#d7aa52",
      metalness: 1,
      roughness: 0.28,
    });
    // Ceramic capacitor bodies: muted tan with metal end caps implied by sheen.
    const passive = new THREE.MeshStandardMaterial({
      color: "#7d6a52",
      roughness: 0.5,
      metalness: 0.2,
    });
    const battery = new THREE.MeshPhysicalMaterial({
      color: "#1a2233",
      roughness: 0.32,
      clearcoat: 0.7,
      clearcoatRoughness: 0.25,
      emissive: "#2dd4bf",
      emissiveIntensity: 0,
    });
    const label = new THREE.MeshStandardMaterial({
      map: tex.battery,
      roughness: 0.5,
      emissive: "#2dd4bf",
      emissiveIntensity: 0,
    });
    const coil = new THREE.MeshStandardMaterial({
      map: tex.coil,
      metalness: 0.85,
      roughness: 0.34,
      side: THREE.DoubleSide,
    });
    const copper = new THREE.MeshStandardMaterial({
      color: "#c27a3a",
      metalness: 0.9,
      roughness: 0.32,
    });
    // Graphite thermal sheet bonded to the back of the display.
    const midplate = new THREE.MeshStandardMaterial({
      color: "#2b313b",
      metalness: 0.55,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
    const black = new THREE.MeshStandardMaterial({
      color: "#07080b",
      roughness: 0.6,
    });
    const scan = new THREE.MeshBasicMaterial({
      map: tex.scan,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const scanLine = new THREE.MeshBasicMaterial({
      color: "#a7f3d0",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const ring = new THREE.MeshBasicMaterial({
      color: "#2dd4bf",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    return {
      frame,
      glass,
      screen: screenMat,
      back,
      plateau,
      lensRing,
      lensGlass,
      lensInner,
      flash,
      pcb,
      shield,
      chip,
      gold,
      passive,
      battery,
      label,
      coil,
      copper,
      midplate,
      black,
      scan,
      scanLine,
      ring,
    };
  }, [screen.texture, tex]);

  // ---------- Surface-mount components (instanced) ----------
  const smd = useMemo(() => {
    const random = rng(detail === "high" ? 48 : 11);
    const count = detail === "high" ? 150 : 60;
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      mat.passive,
      count,
    );
    const dark = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      mat.chip,
      Math.round(count * 0.45),
    );
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    // Keep-out zones occupied by larger packages.
    const busy = (x: number, y: number) =>
      (Math.abs(x + 0.12) < 0.11 && Math.abs(y) < 0.1) ||
      (Math.abs(x - 0.165) < 0.09 && Math.abs(y - 0.135) < 0.09) ||
      (Math.abs(x - 0.12) < 0.06 && Math.abs(y + 0.14) < 0.05);
    const place = (target: THREE.InstancedMesh, n: number) => {
      let i = 0;
      let guard = 0;
      while (i < n && guard < 4000) {
        guard++;
        const x = (random() - 0.5) * 0.54;
        const y = (random() - 0.5) * 0.4;
        if (busy(x, y)) continue;
        const rot = random() > 0.5 ? 0 : Math.PI / 2;
        q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), rot);
        s.set(0.007 + random() * 0.006, 0.0035 + random() * 0.0025, 0.0028);
        p.set(x, y, 0.004 + s.z / 2);
        m.compose(p, q, s);
        target.setMatrixAt(i, m);
        i++;
      }
      target.instanceMatrix.needsUpdate = true;
    };
    place(mesh, count);
    place(dark, dark.count);
    return { mesh, dark };
  }, [detail, mat.chip, mat.passive]);

  // Mutable three.js handles are reached through a ref inside callbacks.
  const live = useRef({ mat, screen });
  useEffect(() => {
    live.current = { mat, screen };
  }, [mat, screen]);

  useEffect(() => {
    let alive = true;
    const paint = () => {
      if (!alive) return;
      const target = live.current.screen;
      drawScreen(target.canvas, screenStage, language);
      target.texture.needsUpdate = true;
    };
    paint();
    // Redraw once web fonts are ready so Tajawal/Inter render on the display.
    void document.fonts?.ready.then(paint);
    return () => {
      alive = false;
    };
  }, [screen, screenStage, language]);

  // ---------- Resource disposal ----------
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose());
      Object.values(tex).forEach((t) => t.dispose());
      screen.texture.dispose();
      Object.values(mat).forEach((m) => m.dispose());
      smd.mesh.geometry.dispose();
      smd.dark.geometry.dispose();
      smd.mesh.dispose();
      smd.dark.dispose();
    },
    [geo, tex, screen, mat, smd],
  );

  useEffect(() => {
    if (!anchorsRef?.current) return;
    anchorsRef.current.display = displayRef.current;
    anchorsRef.current.board = boardRef.current;
    anchorsRef.current.battery = batteryRef.current;
    anchorsRef.current.frame = frameRef.current;
    anchorsRef.current.back = backRef.current;
  }, [anchorsRef]);

  // ---------- Per-frame state application ----------
  useFrame(() => {
    const st = stateRef.current;
    if (!st) return;
    const { mat } = live.current;
    const e = st.explode;
    if (displayRef.current) displayRef.current.position.z = e * 0.62;
    if (boardRef.current) boardRef.current.position.z = e * 0.3;
    if (frameRef.current) frameRef.current.position.z = 0;
    if (batteryRef.current) batteryRef.current.position.z = e * -0.3;
    if (coilRef.current) coilRef.current.position.z = e * -0.54;
    if (backRef.current) backRef.current.position.z = e * -0.8;
    if (internalsRef.current) {
      internalsRef.current.visible = e > 0.002 || st.xray > 0.002;
    }
    const backOpacity = 1 - st.xray * 0.9;
    // Only blend while x-rayed: opaque glass keeps early-z and avoids sorting.
    const seeThrough = backOpacity < 0.995;
    if (mat.back.transparent !== seeThrough) {
      mat.back.transparent = seeThrough;
      mat.plateau.transparent = seeThrough;
      mat.back.needsUpdate = true;
      mat.plateau.needsUpdate = true;
    }
    mat.back.opacity = backOpacity;
    mat.plateau.opacity = Math.min(1, backOpacity + 0.15);
    mat.back.depthWrite = !seeThrough;
    mat.battery.emissiveIntensity = st.highlight * 0.28;
    mat.label.emissiveIntensity = st.highlight * 0.12;

    if (scanRef.current) {
      scanRef.current.visible = st.scanOpacity > 0.001;
      scanRef.current.position.y = THREE.MathUtils.lerp(
        H / 2 + 0.12,
        -H / 2 - 0.05,
        st.scan,
      );
    }
    mat.scan.opacity = st.scanOpacity * 0.85;
    mat.scanLine.opacity = st.scanOpacity;

    if (ringRef.current) {
      const s = st.success;
      ringRef.current.visible = s > 0.001 && s < 0.999;
      ringRef.current.scale.setScalar(0.62 + s * 0.42);
      mat.ring.opacity = Math.sin(s * Math.PI) * 0.8;
    }
  });

  const backZ = -FRONT_Z + 0.004;
  return (
    <group>
      {/* Frame: blue titanium band with buttons and ports. */}
      <group ref={frameRef}>
        <mesh geometry={geo.frame} material={mat.frame} />
        <RoundedBox
          args={[0.014, 0.12, 0.026]}
          radius={0.006}
          position={[W / 2 + 0.002, 0.34, 0]}
          material={mat.frame}
        />
        <RoundedBox
          args={[0.014, 0.12, 0.026]}
          radius={0.006}
          position={[W / 2 + 0.002, 0.18, 0]}
          material={mat.frame}
        />
        <RoundedBox
          args={[0.014, 0.18, 0.026]}
          radius={0.006}
          position={[-W / 2 - 0.002, 0.26, 0]}
          material={mat.frame}
        />
        <RoundedBox
          args={[0.1, 0.03, 0.03]}
          radius={0.012}
          position={[0, -H / 2 + 0.006, 0]}
          material={mat.black}
        />
        {[-1, 1].map((side) =>
          [0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={`${side}-${i}`}
              position={[side * (0.11 + i * 0.024), -H / 2 + 0.004, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              material={mat.black}
            >
              <cylinderGeometry args={[0.0055, 0.0055, 0.02, 12]} />
            </mesh>
          )),
        )}
      </group>

      {/* Display stack: cover glass, emissive panel, rear foil. */}
      <group ref={displayRef}>
        <mesh
          geometry={geo.glass}
          material={mat.glass}
          position={[0, 0, FRONT_Z - 0.002]}
        />
        <mesh
          geometry={geo.screen}
          material={mat.screen}
          position={[0, 0, FRONT_Z - 0.002 + GLASS_T / 2 + GLASS_BEVEL + 0.0004]}
        />
        <mesh
          geometry={geo.midplate}
          material={mat.midplate}
          position={[0, 0, FRONT_Z - 0.008]}
          rotation={[0, Math.PI, 0]}
          scale={[0.96, 0.97, 1]}
        />
      </group>

      {/* Internals are only drawn when exploded or x-rayed. */}
      <group ref={internalsRef} visible={false}>
        <group ref={boardRef}>
          <group position={[0, 0.42, 0.004]}>
            <mesh geometry={geo.pcb} material={mat.pcb} />
            <mesh position={[-0.12, 0, 0.012]} material={mat.shield}>
              <boxGeometry args={[0.2, 0.18, 0.012]} />
            </mesh>
            <mesh position={[-0.12, 0, 0.0185]} material={mat.chip}>
              <boxGeometry args={[0.11, 0.1, 0.002]} />
            </mesh>
            <mesh position={[0.165, 0.135, 0.01]} material={mat.chip}>
              <boxGeometry args={[0.14, 0.12, 0.008]} />
            </mesh>
            <mesh position={[0.12, -0.14, 0.009]} material={mat.gold}>
              <boxGeometry args={[0.1, 0.06, 0.006]} />
            </mesh>
            <mesh position={[0.2, -0.06, 0.008]} material={mat.chip}>
              <boxGeometry args={[0.07, 0.05, 0.004]} />
            </mesh>
            {[
              [-0.27, 0.2],
              [0.27, 0.2],
              [-0.27, -0.2],
              [0.27, -0.2],
            ].map(([sx, sy]) => (
              <mesh
                key={`${sx}${sy}`}
                position={[sx, sy, 0.007]}
                rotation={[Math.PI / 2, 0, 0]}
                material={mat.shield}
              >
                <cylinderGeometry args={[0.011, 0.011, 0.006, 16]} />
              </mesh>
            ))}
            <primitive object={smd.mesh} />
            <primitive object={smd.dark} />
          </group>
          {/* Camera sensor modules mounted under the lens plateau. */}
          {LENSES.map(([lx, ly]) => (
            <mesh
              key={`${lx}${ly}`}
              position={[CAMERA.x - lx, CAMERA.y + ly, -0.012]}
              rotation={[Math.PI / 2, 0, 0]}
              material={mat.shield}
            >
              <cylinderGeometry args={[0.04, 0.04, 0.03, 32]} />
            </mesh>
          ))}
          {/* Flex cable from battery to the logic board. */}
          <mesh position={[0.18, 0.16, 0.002]} material={mat.copper}>
            <boxGeometry args={[0.05, 0.12, 0.002]} />
          </mesh>
        </group>

        <group ref={batteryRef} position={[0, -0.285, 0]}>
          <RoundedBox
            args={[0.6, 0.84, 0.04]}
            radius={0.012}
            smoothness={4}
            material={mat.battery}
          />
          <mesh position={[0, 0, 0.0205]} material={mat.label}>
            <planeGeometry args={[0.56, 0.77]} />
          </mesh>
          {/* Cells carry their printed label on the side facing the back cover. */}
          <mesh
            position={[0, 0, -0.0205]}
            rotation={[0, Math.PI, 0]}
            material={mat.label}
          >
            <planeGeometry args={[0.56, 0.77]} />
          </mesh>
        </group>

        <group ref={coilRef} position={[0, -0.1, -0.0225]}>
          <mesh geometry={geo.coil} material={mat.coil} />
        </group>

      </group>

      {/* Back glass with camera plateau. */}
      <group ref={backRef}>
        <mesh
          geometry={geo.glass}
          material={mat.back}
          position={[0, 0, backZ]}
          rotation={[0, Math.PI, 0]}
        />
        <group position={[CAMERA.x, CAMERA.y, backZ - 0.011]}>
          <mesh
            geometry={geo.plateau}
            material={mat.plateau}
            rotation={[0, Math.PI, 0]}
          />
          {LENSES.map(([lx, ly]) => (
            <group
              key={`${lx}${ly}`}
              position={[-lx, ly, -0.008]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <mesh material={mat.lensRing}>
                <cylinderGeometry args={[0.05, 0.052, 0.014, 48]} />
              </mesh>
              <mesh position={[0, -0.0072, 0]} material={mat.lensGlass}>
                <cylinderGeometry args={[0.041, 0.041, 0.002, 48]} />
              </mesh>
              <mesh position={[0, -0.0083, 0]} material={mat.lensInner}>
                <cylinderGeometry args={[0.016, 0.016, 0.001, 32]} />
              </mesh>
            </group>
          ))}
          <mesh
            position={[0.06, 0.1, -0.0088]}
            rotation={[Math.PI / 2, 0, 0]}
            material={mat.flash}
          >
            <cylinderGeometry args={[0.016, 0.016, 0.003, 24]} />
          </mesh>
          <mesh
            position={[0.06, -0.1, -0.0088]}
            rotation={[Math.PI / 2, 0, 0]}
            material={mat.black}
          >
            <cylinderGeometry args={[0.006, 0.006, 0.003, 16]} />
          </mesh>
        </group>
      </group>

      {/* Diagnostic scan band (front and back faces). */}
      <group ref={scanRef} visible={false}>
        <mesh
          geometry={geo.scanPlane}
          material={mat.scan}
          position={[0, 0.21, -FRONT_Z - 0.03]}
        />
        <mesh
          geometry={geo.scanPlane}
          material={mat.scan}
          position={[0, 0.21, FRONT_Z + 0.03]}
        />
        <mesh material={mat.scanLine} position={[0, 0.005, 0]}>
          <boxGeometry args={[W * 1.22, 0.004, D * 2.2]} />
        </mesh>
      </group>

      {/* Completion pulse. */}
      <mesh
        ref={ringRef}
        geometry={geo.ring}
        material={mat.ring}
        position={[0, 0, -0.12]}
        visible={false}
      />
    </group>
  );
}
