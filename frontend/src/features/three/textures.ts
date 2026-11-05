import * as THREE from "three";
import type { Locale } from "@/components/providers";

/**
 * Procedural textures for the SAYNTRA device model. Everything is drawn at
 * runtime on a canvas, so no third-party bitmap assets are shipped.
 */

export const SCREEN_W = 600;
export const SCREEN_H = 1290;

/** Repair state shown on the device screen. Index into `screenSteps`. */
export type ScreenStage = 0 | 1 | 2 | 3 | 4 | 5;

const screenSteps: ReadonlyArray<readonly [string, string]> = [
  ["Received", "تم الاستلام"],
  ["Diagnosing", "قيد الفحص"],
  ["Awaiting approval", "بانتظار الموافقة"],
  ["In repair", "قيد الإصلاح"],
  ["Quality check", "فحص الجودة"],
  ["Ready for pickup", "جاهز للاستلام"],
];

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function font(weight: number, size: number, language: Locale) {
  const family =
    language === "ar"
      ? '"Tajawal", "Inter", system-ui, sans-serif'
      : '"Inter", "Tajawal", system-ui, sans-serif';
  return `${weight} ${size}px ${family}`;
}

function drawMonogram(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const g = ctx.createLinearGradient(x, y, x + size, y + size);
  g.addColorStop(0, "#3B82F6");
  g.addColorStop(1, "#14B8A6");
  ctx.fillStyle = g;
  roundRect(ctx, x, y, size, size, size * 0.31);
  ctx.fill();
  const s = size / 48;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4.5;
  ctx.lineCap = "round";
  ctx.stroke(new Path2D("M34 13H19a6 6 0 0 0 0 12h10a5 5 0 0 1 0 10H14"));
  ctx.fillStyle = "#A7F3D0";
  ctx.beginPath();
  ctx.arc(34, 13, 3.5, 0, Math.PI * 2);
  ctx.arc(14, 35, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draws the SAYNTRA repair-tracking screen for a given repair state. */
export function drawScreen(
  canvas: HTMLCanvasElement,
  stage: ScreenStage,
  language: Locale,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = SCREEN_W;
  const H = SCREEN_H;
  const rtl = language === "ar";
  const t = (pair: readonly [string, string]) => (rtl ? pair[1] : pair[0]);
  const x = (v: number) => (rtl ? W - v : v);
  const start: CanvasTextAlign = rtl ? "right" : "left";
  const end: CanvasTextAlign = rtl ? "left" : "right";
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.clearRect(0, 0, W, H);

  // Display background: SAYNTRA dark surface with a soft brand glow.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0E1530");
  bg.addColorStop(1, "#0B1020");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.8, 120, 10, W * 0.8, 120, 520);
  glow.addColorStop(0, "rgba(59,130,246,0.35)");
  glow.addColorStop(0.5, "rgba(45,212,191,0.10)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Status bar and camera cut-out.
  ctx.fillStyle = "#F8FAFC";
  ctx.font = font(600, 24, "en");
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("9:41", 52, 56);
  ctx.fillStyle = "#000";
  roundRect(ctx, W / 2 - 78, 30, 156, 48, 24);
  ctx.fill();
  ctx.fillStyle = "#F8FAFC";
  roundRect(ctx, W - 96, 46, 44, 20, 6);
  ctx.fill();
  ctx.fillRect(W - 50, 52, 4, 8);
  for (let i = 0; i < 4; i++) {
    roundRect(ctx, W - 160 + i * 11, 62 - i * 5, 7, 8 + i * 5, 2);
    ctx.fill();
  }

  // App header.
  const monoX = rtl ? W - 52 - 64 : 52;
  drawMonogram(ctx, monoX, 122, 64);
  ctx.textAlign = start;
  ctx.fillStyle = "#F8FAFC";
  ctx.font = font(800, 30, "en");
  ctx.fillText("SAYNTRA", x(132), 146);
  ctx.fillStyle = "#7B8AA0";
  ctx.font = font(500, 21, language);
  ctx.fillText(t(["Repair tracking", "متابعة الصيانة"]), x(132), 176);

  // Repair summary card.
  ctx.fillStyle = "rgba(30,43,71,0.92)";
  roundRect(ctx, 40, 230, W - 80, 290, 34);
  ctx.fill();
  ctx.strokeStyle = "rgba(51,65,85,0.9)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = start;
  ctx.fillStyle = "#A5B4CC";
  ctx.font = font(600, 20, "en");
  ctx.fillText("SYN-0048", x(76), 280);
  ctx.textAlign = end;
  ctx.fillStyle = "#7B8AA0";
  ctx.font = font(500, 19, language);
  ctx.fillText(t(["Sample", "مثال"]), x(W - 76), 280);
  ctx.textAlign = start;
  ctx.fillStyle = "#F8FAFC";
  ctx.font = font(700, 34, language);
  ctx.fillText(t(["Smartphone", "هاتف ذكي"]), x(76), 334);
  ctx.fillStyle = "#A5B4CC";
  ctx.font = font(500, 22, language);
  ctx.fillText(
    t(["Battery replacement", "استبدال البطارية"]),
    x(76),
    372,
  );

  const done = stage === 5;
  const accent = done ? "#10B981" : stage === 2 ? "#F59E0B" : "#3B82F6";
  ctx.font = font(700, 23, language);
  const label = t(screenSteps[stage]);
  const pillW = ctx.measureText(label).width + 64;
  const pillX = rtl ? W - 76 - pillW : 76;
  ctx.fillStyle = done
    ? "rgba(16,185,129,0.18)"
    : stage === 2
      ? "rgba(245,158,11,0.18)"
      : "rgba(59,130,246,0.2)";
  roundRect(ctx, pillX, 410, pillW, 56, 28);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(rtl ? pillX + pillW - 28 : pillX + 28, 438, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#F8FAFC";
  ctx.textAlign = start;
  ctx.fillText(label, rtl ? pillX + pillW - 46 : pillX + 46, 439);

  // Progress timeline.
  ctx.textAlign = start;
  ctx.fillStyle = "#7B8AA0";
  ctx.font = font(600, 20, language);
  ctx.fillText(t(["Progress", "مراحل الطلب"]), x(56), 580);
  const top = 622;
  const gap = 84;
  const railX = x(80);
  ctx.strokeStyle = "rgba(51,65,85,1)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(railX, top);
  ctx.lineTo(railX, top + gap * 5);
  ctx.stroke();
  if (stage > 0) {
    const fill = ctx.createLinearGradient(0, top, 0, top + gap * stage);
    fill.addColorStop(0, "#14B8A6");
    fill.addColorStop(1, "#3B82F6");
    ctx.strokeStyle = fill;
    ctx.beginPath();
    ctx.moveTo(railX, top);
    ctx.lineTo(railX, top + gap * stage);
    ctx.stroke();
  }
  screenSteps.forEach((step, i) => {
    const cy = top + i * gap;
    const isDone = i < stage || (done && i === 5);
    const isCurrent = i === stage && !done;
    if (isCurrent) {
      ctx.fillStyle = "rgba(59,130,246,0.25)";
      ctx.beginPath();
      ctx.arc(railX, cy, 24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = isDone ? "#14B8A6" : isCurrent ? "#3B82F6" : "#26324D";
    ctx.beginPath();
    ctx.arc(railX, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    if (isDone) {
      ctx.strokeStyle = "#0B1020";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(railX - 6, cy);
      ctx.lineTo(railX - 1, cy + 5);
      ctx.lineTo(railX + 7, cy - 5);
      ctx.stroke();
    }
    ctx.fillStyle = isDone || isCurrent ? "#F8FAFC" : "#7B8AA0";
    ctx.font = font(isCurrent ? 700 : 500, 25, language);
    ctx.textAlign = start;
    ctx.fillText(t(step), x(124), cy + 1);
  });

  // Action area.
  const btnY = H - 190;
  if (done) {
    const g = ctx.createLinearGradient(40, 0, W - 40, 0);
    g.addColorStop(0, "#10B981");
    g.addColorStop(1, "#14B8A6");
    ctx.fillStyle = g;
  } else {
    const g = ctx.createLinearGradient(40, 0, W - 40, 0);
    g.addColorStop(0, "#3B82F6");
    g.addColorStop(0.55, "#14B8A6");
    g.addColorStop(1, "#2DD4BF");
    ctx.fillStyle = g;
  }
  roundRect(ctx, 40, btnY, W - 80, 92, 30);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = font(700, 27, language);
  ctx.fillText(
    done
      ? t(["Device ready, collect today", "الجهاز جاهز للاستلام"])
      : t(["View repair details", "تفاصيل طلب الصيانة"]),
    W / 2,
    btnY + 47,
  );
  // Home indicator.
  ctx.fillStyle = "rgba(248,250,252,0.7)";
  roundRect(ctx, W / 2 - 90, H - 40, 180, 9, 5);
  ctx.fill();
}

export function createScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = SCREEN_W;
  canvas.height = SCREEN_H;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return { canvas, texture };
}

/** Printed label for the battery cell. */
export function createBatteryTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 700;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#1A2233";
    ctx.fillRect(0, 0, 512, 700);
    const sheen = ctx.createLinearGradient(0, 0, 512, 700);
    sheen.addColorStop(0, "rgba(255,255,255,0.05)");
    sheen.addColorStop(0.5, "rgba(255,255,255,0)");
    sheen.addColorStop(1, "rgba(255,255,255,0.04)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, 512, 700);
    drawMonogram(ctx, 56, 70, 72);
    ctx.fillStyle = "#E2E8F0";
    ctx.font = '700 40px "Inter", sans-serif';
    ctx.fillText("SAYNTRA", 148, 120);
    ctx.fillStyle = "#94A3B8";
    ctx.font = '500 24px "Inter", sans-serif';
    ctx.fillText("Service part · Li-ion polymer cell", 56, 210);
    ctx.fillText("Rechargeable · Do not puncture", 56, 248);
    ctx.strokeStyle = "rgba(148,163,184,0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(56, 300, 400, 1);
    // Barcode-like strip, procedurally generated.
    let seed = 7;
    for (let bx = 56; bx < 456; ) {
      seed = (seed * 16807) % 2147483647;
      const w = 2 + (seed % 5);
      if (seed % 3) {
        ctx.fillStyle = "#CBD5E1";
        ctx.fillRect(bx, 340, w, 90);
      }
      bx += w + 2;
    }
    ctx.fillStyle = "#64748B";
    ctx.font = '500 22px "Inter", sans-serif';
    ctx.fillText("SYN-CELL-0048", 56, 470);
    // Safety pictograms (generic outlines).
    ctx.strokeStyle = "#64748B";
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.strokeRect(56 + i * 84, 560, 60, 60);
    }
    ctx.beginPath();
    ctx.moveTo(326, 620);
    ctx.lineTo(356, 560);
    ctx.lineTo(386, 620);
    ctx.closePath();
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Concentric copper winding for the wireless-charging coil. */
export function createCoilTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#3b2414";
    ctx.fillRect(0, 0, 512, 512);
    for (let r = 120; r < 254; r += 5) {
      ctx.strokeStyle = r % 10 === 0 ? "#c98a4e" : "#a86a36";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Subtle gloss monogram printed under the back glass. */
export function createBackTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1056;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 512, 1056);
    ctx.save();
    ctx.translate(256 - 60, 600);
    ctx.scale(2.5, 2.5);
    ctx.strokeStyle = "#c7d0dc";
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.stroke(new Path2D("M34 13H19a6 6 0 0 0 0 12h10a5 5 0 0 1 0 10H14"));
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Soft vertical falloff used by the diagnostic scan band. */
export function createScanTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "rgba(45,212,191,0)");
    g.addColorStop(0.82, "rgba(45,212,191,0.35)");
    g.addColorStop(0.97, "rgba(167,243,208,0.95)");
    g.addColorStop(1, "rgba(45,212,191,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
