# Testing

## Backend

Create a separate `sayntra_test` MySQL database and give the test user permission on that database only. The test bootstrap refuses database names not ending in `_test` before migrations run.

```powershell
cd backend
php artisan test
```

If your MySQL password differs from the blank local example, configure test credentials using environment variables or `.env.testing` (never commit that file). `phpunit.xml` defines the test database name, array sessions/cache and array mail. MySQL host, username and password come from your test environment. Read it before changing test environment values. Do not run tests against development/production customer data.

Coverage includes authentication, recovery token reuse, verification signatures, login throttling, mass-assignment protection, tenant boundaries, customer duplication, device association, repair assignment/diagnosis/transitions, technician restrictions, invitations and last-owner protection.

## Frontend

```powershell
cd frontend
npm ci
npm run typecheck
npm run lint
npm run build
```

## Browser tests

Playwright starts the real Laravel and Next.js processes. It does not replace API handlers. You need PHP on PATH, MySQL running, migrated tables, and a locally seeded demo owner and technician for the authenticated test journeys.

Use a separate disposable browser-test database. From the backend terminal, configure the intended test database and migrate/seed it first. Keep the same `DB_DATABASE` environment setting available to Playwright's backend webServer process. Browser tests create real records; do not point them at a live workspace.

```powershell
cd frontend
npx playwright install chromium
$env:E2E_OWNER_PASSWORD = 'THE_PASSWORD_YOU_USED_FOR_DEMO_SEEDING'
$env:DB_DATABASE = 'sayntra_test'
npm run test:e2e
Remove-Item Env:E2E_OWNER_PASSWORD
Remove-Item Env:DB_DATABASE
```

The seed password is supplied through `DEMO_SEED_PASSWORD` in a backend terminal. Re-running the seeder preserves existing account passwords. Either use that original password or recreate only the disposable test database.

Tests cover marketing hydration, language/theme persistence, 390/768/1440px public layouts, reduced motion, registration, cookie-session login/logout, and customer/device/repair intake through assignment and diagnosis. Financial and delivered-repair browser coverage cannot be claimed for this archive.

Results and traces are generated under `frontend/test-results` and `frontend/playwright-report`; these are excluded from the release ZIP.
