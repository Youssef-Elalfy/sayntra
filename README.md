# SAYNTRA — صاينترا

**Smarter Repairs. Better Business.**

A real Laravel 13 + Next.js repair-center application, backed by MySQL and cookie-based Sanctum authentication.

> **Development checkpoint, 27 October 2026. Not a completed production SaaS.**
> This archive contains the verified source currently available. It supports account creation, organizations, team access, customer/device intake, technician assignment and diagnosis. Inventory, estimates, invoices, payments, customer tracking, warranty, PDF documents and real-time notifications are **not delivered in this archive**. Earlier chat descriptions of those additions must not be treated as evidence that their source is included. See `STATUS.md`.

## Start here

- **Windows / VS Code:** [setup guide](docs/LOCAL_SETUP_WINDOWS.md)
- **بداية سريعة بالعربي:** [اقرأ هذا أولًا](docs/START_HERE_AR.md)
- [Architecture](docs/ARCHITECTURE.md) · [API](docs/API.md) · [Roles](docs/PERMISSIONS.md)
- [Testing](docs/TESTING.md) · [Deployment preparation](docs/DEPLOYMENT.md) · [Quality evidence](docs/QUALITY.md)

## Repository

```text
sayntra/
  backend/      Laravel root: artisan, composer.json, app, routes, migrations, tests
  frontend/     Next.js root: package.json, src/app, reusable UI and feature code
  brand/        Original SVG logo variants
  docs/         Setup, architecture, API, testing and deployment documentation
```

The root `npm run dev` starts the **Next.js frontend**. Start Laravel separately from `backend`. No Python preview is used or required. The ZIP intentionally excludes dependencies, credentials, generated caches, database contents and runtime binaries. Install PHP/Composer, Node.js and MySQL, then run `composer install` and `npm ci` as documented.

## What works in this checkpoint

- Registration creates an organization and its owner in a database transaction.
- Login/logout, password reset, email verification, profile/password updates.
- Shared-database organization scoping, role gates, repair policies and cross-tenant composite foreign keys.
- Customer creation, search, editing and history; duplicate phone prevention.
- Device registration, search, editing and history; organization-scoped identifiers.
- Repair intake with generated reference, assignment/reassignment, diagnosis, guarded status changes and audit history.
- Team invitations with hashed expiring tokens; role/activation management and last-owner protection.
- Dashboard counts come from persisted records, filtered by role and assignments.
- English/Arabic UI, RTL, local Inter/Tajawal fonts, light/dark/system preferences and reduced-motion support.
- Marketing/authentication pages with the SAYNTRA Living Network effect. Marketing interface illustrations are explicitly sample previews.

Repair processing is **not yet complete through delivery**: estimates, approved parts, stock deductions, invoicing and handover conditions need the next milestone. Do not bypass these missing steps by editing statuses directly in MySQL.

## Local mail and demo users

The default mail driver is `log`. It writes verification, recovery and invitation links to `backend/storage/logs/laravel.log`; it does not send email. SMTP delivery has not been configured or verified.

Optional demo seeding requires a password supplied through `DEMO_SEED_PASSWORD`; no fixed password is embedded in the archive. It creates `owner@sayntra.test` and `technician@sayntra.test` for local/testing environments only.

## Product scope

No paid subscription, online payment processing, SMS, WhatsApp, WebSocket deployment or live production deployment is claimed. See `STATUS.md` for the remaining milestones.
