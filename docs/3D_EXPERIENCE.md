# SAYNTRA 3D experience

Added 5 November 2026; extended the same day with the Living Network 3D background, responsive story framing and dimensional cards. The workspace (`/app`) never renders WebGL; it uses CSS depth only.

## What it is

One original, procedurally modelled smartphone used in two places:

| Where | Component | Behaviour |
|---|---|---|
| Hero | `HeroDevice` → `three/hero-scene.tsx` | One entrance (device settles into pose), gentle pointer parallax, slow float. Faces the copy: mirrored in Arabic RTL. Screen shows the SAYNTRA tracking UI in the current language. |
| "Follow one repair" section | `RepairStory` → `three/story-scene.tsx` | Scroll-driven, sticky. Intake → diagnosis (back glass turns translucent, scan band sweeps, battery highlights) → exploded view along the stacking axis → connected operations (nodes and paths to Technician, Diagnosis, Customer, Spare parts, Approval, Reports) → reassembly → ready for pickup (completion ring). The on-screen repair status follows the stage. |

The stage captions mark *Inside the repair* and *Connected operations* as **In development**, because estimates, approvals, spare parts and reports are not implemented in the backend. The section states "Illustrative 3D model with sample data."

## Living Network 3D background

`three/ambient-scene.tsx`, mounted through `features/ambient.tsx` on the landing, login/registration/password, verification and invitation pages. One fixed canvas behind the page (`.ambient-layer`, `z-index: -1`), not one per section.

- Two silk ribbons: a custom shader displaces a plane (S-curve + layered swells), lights it from screen-space derivatives (diffuse, specular, fresnel) and draws flowing thread lines. Brand gradient blue → teal → mint → lavender; light mode is brighter/softer, dark mode deeper.
- A sparse circuit network behind them: nodes with up to two neighbours, routed as PCB-style traces (straight run + 45° chamfer); data pulses move along traces entirely in the vertex shader.
- Responds to pointer (surface bulge + parallax), scroll (palette drift, depth shift) and theme (smooth light/dark crossfade, follows the System setting live).
- DPR capped at 1.25 (high) or 1 (balanced), `powerPreference: low-power`; reduced motion renders on demand only.
- Not used at ≤760px or on touch/coarse pointers, or without WebGL: the existing CSS Living Network stays in the markup as the fallback.

## Responsive story composition

Connection labels are real DOM laid out by CSS, not positioned from world coordinates:

- Stage ≥ 640px wide: two label columns (`grid-template-columns: max-content 1fr max-content`). Logical columns mirror automatically in RTL. Start column connects to the front layers (display, logic board), end column to the rear layers (frame, battery, back glass), so lines never cross the device.
- Narrower stages: a compact wrapped row of chips under the device; lines are quieter.
- A `ResizeObserver` measures each label dot and the free area between labels; the 3D lines end exactly at the measured dots, and the device is scaled and centred into that safe area every frame (assembled vs exploded extents). The whole choreography is mirrored for Arabic.
- `tests/e2e/responsive-story.spec.ts` asserts every label is inside the stage and the viewport, with no horizontal overflow, for all six stages at 10 widths (320–1920) in English and Arabic.

## Dimensional cards

`components/tilt.tsx`: one delegated pointer listener drives CSS variables on any `[data-tilt]` element (perspective tilt, moving glare, contact shadow that follows the pointer, floating icon layer, spring-like settle). Used on feature, pricing and workflow cards and on dashboard KPI cards (which also count up). Mouse only; off for touch and reduced motion. No WebGL per card.

## Asset pipeline (honest scope)

No GLB/Blender asset is used. Blender is not available in this environment, and no third-party models were downloaded. The device is built in code (`three/device-model.tsx`):

- Frame: extruded rounded-rect ring with real bevels, anisotropic blue-titanium PBR metal, buttons, USB-C port, speaker holes.
- Cover glass and screen: clear-coated black glass; the screen is an emissive canvas texture (`three/textures.ts`) drawn in Inter/Tajawal, with RTL layout for Arabic.
- Back: frosted clear-coat glass with a gloss SAYNTRA monogram (roughness map), camera plateau, three iridescent-coated lenses in metal rings, flash and mic.
- Internals (drawn only when exploded/x-rayed): PCB with RF shield, SoC, memory, gold connector, screws, ~150 instanced surface-mount parts, camera sensor modules, flex cable, labelled battery cell, copper wireless-charging coil, graphite display sheet.
- Lighting: procedural studio light cards (`drei` `Environment` + `Lightformer`, rendered once), Khronos PBR Neutral tone mapping, soft contact shadow.

This is a stylised product visualisation, not a photogrammetric or photoreal render. A Blender-authored GLB with baked AO and KTX2 textures would be the next quality step.

## Performance and fallbacks

- Three.js, R3F and Drei load in separate lazy chunks (`next/dynamic`, `ssr: false`); the page's first render does not wait for them. `three/capabilities.ts` must stay free of three.js imports.
- Each canvas renders only while on screen (`frameloop="never"` off-screen).
- Render tier: `balanced` (DPR 1.25, fewer instanced parts, no story shadow) for ≤4 cores, ≤4 GB memory or ≤760px viewports; otherwise `high` (DPR 1.75). `PerformanceMonitor` drops DPR to 1 and removes shadows if the frame rate declines.
- Reduced motion: no entrance, float or parallax; the story renders on demand and jumps straight to each scroll position.
- No WebGL: the hero shows the existing 2D interface preview and the story becomes a static, fully expanded list.
- Geometries, materials and textures are disposed on unmount.

Measured: 60 fps (the requestAnimationFrame cap) for the hero at 1440×900, DPR 1, in Chrome on an Intel UHD Graphics 630 integrated GPU. Not measured: high-DPR laptops, physical phones, Safari and Firefox.

## Files

`frontend/src/features/repair-story.tsx` and `frontend/src/features/three/*`; styles at the end of `frontend/src/app/globals.css`; browser tests in `frontend/tests/e2e/experience-3d.spec.ts`.
