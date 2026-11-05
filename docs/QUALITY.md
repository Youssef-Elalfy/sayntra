# Executed quality evidence

Checkpoint: 27 October 2026. These results apply to the source in this archive, not to the full master specification. The application is not deployed or production-ready.

## Runtime used

Linux, PHP 8.3.6, MySQL 8.0.46, Laravel 13.38.0, Sanctum 4.3.3, Node 24.22.1, Next.js 16.4.3 and Playwright 1.56.1 with Chromium 141. Dependency versions are pinned in the Composer/npm lock files. Windows PowerShell setup is documented but was not executed on a Windows machine here.

## Actual results

| Check | Result |
|---|---|
| MySQL migrations on a disposable database | All 5 migrations passed |
| `php artisan test --compact` | **21 passed, 89 assertions** (4.10s final run); includes the two original framework smoke tests |
| `npm run lint` | Passed, exit 0 |
| `npm run typecheck` | Passed, exit 0 |
| `npm run build` | Passed, exit 0; all implemented routes generated with Next webpack |
| `npx playwright test` against real Laravel/MySQL | **8 passed**, no skipped tests in the configured run (1.1m) |
| Laravel Pint for changed PHP | Completed successfully |

The first browser workflow run revealed a navigation race in the test: it clicked an identically labeled button on the departing page. The test now waits for the intended URL and page heading. The rerun passed all eight tests. The password settings form was also corrected to use the backend's POST route before final validation.

Browser checks run against Next's development server and real Laravel endpoints, including real CSRF/session cookies. The separate production build passed; a deployed production browser run has not been performed. Minor marketing copy clarifications and locale-aware date formatting were followed by passing lint/type/build checks.

## Verified workflow

Registration creates a workspace; seeded-owner login creates a real cookie session. The operations browser test creates a customer, registers a device, creates a repair, assigns the seeded technician, records a diagnosis, reloads and verifies the persisted findings. It then switches to Arabic/dark mode on a 390px viewport and checks for horizontal overflow.

Backend tests additionally cover duplicate customer/device rules, cross-tenant read/write and relationship rejection, technician assignment/privacy, disallowed and stale transitions, invitation token reuse, active repair archival rules, last-owner protection, password recovery and signed verification.

## Responsive and visual review

- Public and authentication pages checked at 390, 768 and 1440px.
- Arabic RTL, English LTR, persisted theme/language and reduced-motion content visibility checked in Chromium.
- The Arabic dark repair detail was visually inspected at 390px: actions wrap, cards fit, timeline and diagnosis remain readable.
- Keyboard labels and native dialog/form controls are implemented; this is not a complete WCAG audit.
- Safari, Firefox, physical mobile devices and the full light/dark matrix of every page remain to be reviewed.

## Security review scope and remaining work

Tenant scopes fail closed; policies/gates enforce roles; technician responses omit customer contact data and device serial numbers. Tests demonstrate organization isolation for the implemented customer/device/repair endpoints. Tenant ownership is server-assigned and protected by composite foreign keys. Password hashes, CSRF, session regeneration/invalidation, login throttling and hashed expiring invitation tokens are implemented.

No test can establish isolation for missing inventory/invoice/attachment modules. Their tests, concurrent financial/stock mutation checks, private attachment handling and protected customer links must be implemented with those modules. Full penetration testing, dependency vulnerability audit, sustained load testing, backup/restore rehearsal and production security-header validation have not been executed.

Mail is the local log driver: actual SMTP delivery is unverified. Local logs can contain verification/invitation links and must stay private; logs, environment secrets, database files, dependencies, screenshots and traces are excluded from the ZIP.

See `STATUS.md` for feature limitations and `TESTING.md` to reproduce the available checks.

## Update: 5 November 2026 (Windows 10, local)

Runtime: Windows 10, PHP 8.5.12 (Herd), MySQL 8.4.13, Node 24.14.1, Next.js 16.4.3, three 0.187.0, @react-three/fiber 9.8.2, @react-three/drei 10.7.9, Google Chrome (Playwright `E2E_CHANNEL=chrome`).

| Check | Result |
|---|---|
| `npm run typecheck` | Passed |
| `npm run lint` | Passed (0 problems) |
| `npm run build` | Passed; all routes generated |
| Playwright `experience-3d.spec.ts` + `public.spec.ts` (excluding registration/login, which need the backend) against `next start` | **8 passed** |
| Console on production build during a full story scroll | No errors or warnings logged |
| Hero frame rate, Chrome, Intel UHD 630, 1440×900, DPR 1 | 60 fps (rAF cap) |
| `php artisan test` | **Not run successfully: 19 of 21 tests error before any assertion.** The MySQL user `sayntra_dev` has no privileges on the disposable `sayntra_test` database. A MySQL administrator must create it and grant access. |

Visually reviewed with screenshots: hero in English light and Arabic dark at 1440px; hero and story at 375px (Arabic, dark); story stages 2, 4 and 6 at 1440px. Not reviewed: Safari, Firefox, physical devices, high-DPR displays.

## Update: 5 November 2026, UI/UX and immersive 3D pass (Windows 10, local)

Production build (`next build` + `next start`) against the real Laravel API and MySQL, Google Chrome via Playwright (`E2E_CHANNEL=chrome`). Demo users were created with the project's local-only seeder; the generated password is kept in `frontend/.env.e2e.local` (gitignored).

| Check | Result |
|---|---|
| `npm run typecheck`, `npm run lint`, `npm run build` | Passed |
| Full Playwright suite (`npx playwright test`) | **38 passed, 0 failed, 0 skipped** (4.4 min) |
| `responsive-story.spec.ts`: all 6 story stages × 10 widths (320–1920) × en/ar | Every connection label inside the stage and viewport; no horizontal overflow |
| `theme-menu.spec.ts`: en/ar × light/dark/system + 320px | Keyboard (Arrow/Home/End/Enter/Escape), focus return, persistence; every option ≥ 4.5:1 contrast |
| `operations.spec.ts` | Customer → device → repair → technician → diagnosis persisted in MySQL; Arabic/dark 390px check |
| `public.spec.ts` | Registration (real API, 201), login/logout, preferences, 390/768/1440 fit, reduced motion |
| Responsive audit script, 14 pages × 10 widths × (en light, ar dark) | No page-level overflow; data tables fixed (card layout); `/login` 320px overflow fixed |
| `php artisan test` | **Still not runnable**: MySQL user lacks access to `sayntra_test` (see previous update) |

Agent reviews actually run: `senior-ui-ux-designer` (review only) and `frontend-qa` (read-only browser QA). Their findings and what was applied are in the session report. Not verified: Safari, Firefox, physical touch devices, high-DPR GPU performance, a full WCAG audit.
