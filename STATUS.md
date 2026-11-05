# Authoritative archive status

Checkpoint: **27 October 2026**. This file describes the actual contents of this ZIP, not planned work or claims in earlier chat updates.

## Implemented

- Laravel 13.38.0 / PHP 8.3+, Sanctum 4.3.3, Next.js 16.4.3 / React / strict TypeScript.
- MySQL migrations, scoped organization ownership, role gates, repair policies, audit records and relational constraints.
- Cookie session registration/login/logout, recovery, verification, profile/password endpoints and matching UI.
- Bilingual marketing/auth screens, themed workspace, original SVG monogram, Inter/Tajawal fonts, reduced-motion-aware animation.
- Customers/devices: create, read, update, search and repair history. Customer archival exists in the API, guarded against active repairs; no archive button is exposed in this checkpoint.
- Repair intake, technician assignment, diagnosis, notes, status history, permitted transitions and stale-status rejection.
- Team invitations, hashed expiring tokens, invitation acceptance, membership role/activation management; last active owner and active technician assignments protected.
- Dashboard real repair/customer counts; technician access limited to assigned repairs.
- **5 Nov 2026:** original procedural 3D smartphone (Three.js / React Three Fiber / Drei) in the landing hero and a scroll-driven "Follow one repair" story section, with RTL mirroring, render tiers, reduced-motion and no-WebGL fallbacks. See `docs/3D_EXPERIENCE.md`.

## Tested

The current executed results are recorded in `docs/QUALITY.md`. Backend tests use MySQL, not a substitute database. Browser tests use actual Laravel endpoints and session cookies.

## Not implemented / not included

- Estimates and customer financial approval, inventory movements/parts consumption, supplier workflows.
- Invoices, payments/refunds, financial reports and PDFs.
- Secure customer tracking portal, warranty claims, attachments, in-app notifications, Reverb/Echo.
- Platform administration UI, custom per-member permission editing, multi-branch management, subscriptions, usage limits and online payment gateways.
- Full end-to-end repair-to-delivery lifecycle; financial/concurrency invariants cannot be claimed without those modules.
- Complete advanced design-system controls, all requested analytics charts, comprehensive accessibility audit or production load testing.

Roles for inventory/accounting are defined for future modules, but those modules have no working navigation or operational pages in this archive.

## Milestone assessment

- M1: runnable and tested foundation.
- M2: marketing/authentication implementation and browser checks; SMTP delivery and full onboarding refinement remain.
- M3: customer/device intake, assignment and diagnosis implemented; the complete business lifecycle is unfinished.
- M4–M6: pending. This checkpoint is **not production-ready**.

## Deployment

**Not deployed.** Deployment notes prepare a future staging environment; they are not evidence of a deployment or a completed security certification.

## Continuation priority

1. Estimates with integer minor-unit calculations and explicit approvals.
2. Inventory receipts/consumption with transactional locks and idempotency tests.
3. Immutable invoices, partial payments/refunds and protected handover.
4. Private attachments/tracking, warranties, notifications and reports.
5. Full workflow browser tests, concurrency/security review, Arabic PDF QA and production hardening.
