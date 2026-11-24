# SAYNTRA: portfolio content

Ready-to-use copy and links for a portfolio entry. Every claim below matches the repository, the [case study](CASE_STUDY.md) and the recorded results in [QUALITY.md](QUALITY.md).

## Title

SAYNTRA — A Smarter Way to Manage Repairs

## Subtitle

A bilingual repair-management platform combining a cinematic 3D experience with practical operational workflows.

## Card description (short)

Repair management for phone and electronics repair centers: customers, devices, technician assignment, diagnosis and a guarded status workflow, in Arabic and English, introduced by a procedural 3D smartphone.

## Extended introduction

SAYNTRA is a repair-management workspace for repair centers, built as a Next.js frontend over a Laravel 13 API with MySQL. Receptionists register customers and devices and open repair orders. Technicians record diagnoses and move each repair through an enforced sequence of statuses, and owners follow the whole operation on a role-aware dashboard. Organizations are isolated from each other in the application and in the database itself, through composite foreign keys.

The interface is fully bilingual, with a mirrored right-to-left Arabic layout, and supports light, dark and system themes. The landing page explains the product with an original smartphone modelled in code that follows one repair from intake to pickup.

The public website runs as a portfolio demo: the same frontend built with an in-browser backend and a fictional repair center, so visitors can explore the workspace without an account and without any connection to a server or database. The full Laravel application is in the repository; its production deployment is planned, not live.

## Category

Web application · SaaS product design · Full-stack development · Creative development (3D)

## Technology tags

Next.js 16 · React 19 · TypeScript · Three.js · React Three Fiber · GLSL · TanStack Query · Tailwind CSS 4 · Laravel 13 · PHP · Sanctum · MySQL · Playwright · GitHub Actions · Vercel · Arabic RTL

## Role

Product design, brand identity, UI/UX, 3D modelling in code, frontend and backend engineering, testing and deployment.

## Challenges

- Designing a repair workflow that cannot be skipped or overwritten from a stale screen.
- Isolating many businesses in one database at the session, model and foreign-key level.
- Making Arabic a first-class layout, including inside a WebGL canvas texture.
- Keeping 3D story labels and connection lines aligned at every width and in both directions.
- Publishing a safe, explorable demo without forking the interface or exposing a backend.

## Engineering highlights

- `RepairWorkflow` service with an explicit transition map, transactions, row locks and expected-status checks.
- Organization-scoped tenancy that fails closed, with composite `(organization_id, id)` foreign keys.
- Sanctum cookie sessions through same-origin Next.js rewrites; hashed, expiring invitation tokens; last-owner protection.
- Procedural 3D smartphone with an x-ray diagnosis, an exploded view and a scroll-driven story; render tiers and reduced-motion and no-WebGL fallbacks.
- In-browser demo backend with the same response shapes as Laravel, switched at the API client by a build flag.
- Recorded QA: 38/38 Playwright tests against the real API and MySQL, 9/9 demo and 3D tests on the live site, responsive checks at 10 widths in both languages, lowest measured text contrast 5.88 : 1, 60 fps hero on an integrated GPU.

## Media

| Use | File |
|---|---|
| Cover image | [`media/cover.webp`](media/cover.webp) |
| Animated preview | [`media/preview.webp`](media/preview.webp) |
| Walkthrough video | [`media/preview.mp4`](media/preview.mp4) |
| Dashboard (dark / light) | [`media/dashboard.webp`](media/dashboard.webp) · [`media/dashboard-light.webp`](media/dashboard-light.webp) |
| Repair orders / details | [`media/repairs.webp`](media/repairs.webp) · [`media/repair-details.webp`](media/repair-details.webp) |
| Customers / customer detail | [`media/customers.webp`](media/customers.webp) · [`media/customer-detail.webp`](media/customer-detail.webp) |
| Devices / team | [`media/devices.webp`](media/devices.webp) · [`media/team.webp`](media/team.webp) |
| Arabic RTL | [`media/arabic-rtl.webp`](media/arabic-rtl.webp) · [`media/arabic-repair.webp`](media/arabic-repair.webp) · [`media/arabic-hero.webp`](media/arabic-hero.webp) |
| Landing | [`media/hero.webp`](media/hero.webp) · [`media/hero-light.webp`](media/hero-light.webp) · [`media/repair-story.webp`](media/repair-story.webp) · [`media/features.webp`](media/features.webp) |
| Mobile | [`media/mobile.webp`](media/mobile.webp) |

All images and the video are captures of the live deployment at sayntra.vercel.app, framed in a browser or phone outline. None are AI-generated.

## Links

| | URL |
|---|---|
| Live website | https://sayntra.vercel.app |
| Interactive demo | https://sayntra.vercel.app/demo |
| GitHub repository | https://github.com/Youssef-Elalfy/sayntra |
| Case study | https://github.com/Youssef-Elalfy/sayntra/blob/main/docs/CASE_STUDY.md |

## SEO

**Title (≤ 60 characters):** SAYNTRA — Bilingual Repair Management Platform | Case Study

**Description (≤ 160 characters):** A bilingual Arabic/English repair-management platform built with Next.js, Laravel and Three.js: repair workflows, multi-tenancy and a 3D product story.

## Notes for use

- Describe the public site as an **interactive portfolio demo with fictional data**, and the Laravel application as the full implementation in the repository.
- Do not describe SAYNTRA as a launched commercial product. It has no customers, revenue or usage figures to report.
- Estimates, inventory, invoices and delivery handover are next milestones, not current features.
