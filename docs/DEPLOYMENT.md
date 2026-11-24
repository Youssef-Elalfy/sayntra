# SAYNTRA deployment plan: secure development preview

Status (November 2026): the **portfolio demo** is deployed at https://sayntra.vercel.app (Vercel project `sayntra`, root `frontend`, `NEXT_PUBLIC_DEMO_MODE=true`, `NEXT_PUBLIC_DEPLOY_STAGE=demo`). It needs no backend or secrets. The source is public at https://github.com/Youssef-Elalfy/sayntra. The **full application below (Laravel + MySQL) is not deployed.** Every external step needs the owner's explicit approval because it creates accounts, billable resources or public URLs.

## Target architecture

```text
Browser ──HTTPS──> Vercel (Next.js, frontend/)
                     │  rewrites /api/* and /sanctum/* (server side)
                     ▼
                   Laravel host (backend/, PHP 8.4) ──TLS──> Managed MySQL 8
                     └── SMTP provider (verification, reset, invitations)
```

The browser only ever talks to the Vercel domain. Next.js rewrites proxy `/api` and `/sanctum` to Laravel, so Sanctum session and XSRF cookies are first-party on the Vercel host: no cross-site cookies, no credentialed CORS, `SESSION_DOMAIN=null`.

## Recommended providers (decision for the owner)

| Layer | Recommendation | Why | Cost note |
|---|---|---|---|
| Source | Private GitHub repository | Vercel and Laravel hosts deploy from it; CI in `.github/workflows/ci.yml` | Free for private repos |
| Frontend | Vercel, root directory `frontend` | Next.js native, automatic preview per branch/PR | Hobby is free but for non-commercial use; a commercial launch needs Pro. Confirm current terms. |
| Backend | Laravel Cloud (alternatives: Forge + VPS, Railway) | Built for Laravel: PHP 8.4, queues, scheduler, Git deploys, preview environments | Paid usage; check current pricing before approval |
| Database | The Laravel host's managed MySQL 8 (or PlanetScale/Aiven MySQL) | Persistent, backups, private networking | Paid; enable automated backups |
| Email | SMTP from Resend, Postmark, Brevo or Mailgun | Uses Laravel's built-in `smtp` mailer, no new dependency | Free tiers exist; needs a domain with SPF/DKIM |
| Domain | Optional for the preview (`*.vercel.app` works) | A custom domain is needed for branded email sending | Registrar fee |

Vercel alone cannot host the Laravel API, its database or queue workers.

## Step by step (each step: owner approval first)

1. **GitHub:** create a *private* repository, add it as `origin`, push `main`. Branch protection on `main`: require the CI workflow.
2. **Database:** create a production MySQL 8 database and a user restricted to it. Never reuse or copy the local development database or its test accounts.
3. **Laravel host:** connect the repository, application root `backend/`, PHP 8.4. Set the variables from `backend/.env.production.example` in the secret manager. Deploy commands: `composer install --no-dev --optimize-autoloader`, `php artisan migrate --force` (fresh database only; take a backup first on any later release), `php artisan optimize`. Never run `migrate:fresh` or seeders in production; the demo seeder refuses to run outside local/testing.
4. **Email:** verify the sending domain with the SMTP provider; set `MAIL_*`. Test registration → verification → login and password reset end to end before inviting anyone.
5. **Vercel:** import the repository, root directory `frontend`, framework Next.js (build command `npm run build`). Variables from `frontend/.env.production.example`: `NEXT_PUBLIC_DEPLOY_STAGE=preview` (shows the "Development preview" banner and sets `noindex`), `API_INTERNAL_URL=<Laravel URL>`.
6. **Connect the two:** set `FRONTEND_URL` and `SANCTUM_STATEFUL_DOMAINS` on Laravel to the stable Vercel host (for example `sayntra-preview.vercel.app`). Set `TRUSTED_PROXIES` to the host's load-balancer ranges so HTTPS and client IPs are detected.
7. **Verify on the deployed URLs:** registration, email verification link, login/logout, CSRF, a customer → device → repair → diagnosis flow, Arabic/English, light/dark, 3D fallback. Run the Playwright suite against the preview with `E2E_BASE_URL`.

## Continuous delivery

- `ci.yml` runs on every push/PR: frontend typecheck, lint and production build; backend PHPUnit against a throwaway MySQL 8.4 service container.
- Vercel creates a preview deployment for every branch/PR automatically. Production releases only from `main` after CI passes and the owner approves.
- Per-branch Vercel preview URLs change each time. Only the stable preview host is listed in `SANCTUM_STATEFUL_DOMAINS`; sign-in on ad-hoc preview URLs is intentionally not enabled.

## Security checklist before sharing the preview

- `APP_DEBUG=false`, `APP_ENV=production`, unique `APP_KEY` backed up securely.
- `SESSION_SECURE_COOKIE=true`, `SESSION_ENCRYPT=true`, HTTPS only.
- `TRUSTED_PROXIES` set to the provider's ranges, not `*`, unless the API is reachable only through them. Login/registration throttles use the client IP; a spoofable `X-Forwarded-For` would weaken them.
- Database user limited to the SAYNTRA database; automated backups on; a restore rehearsed once.
- No real customer data while the banner says "Development preview".
- Rotate any credential that was ever shared in chat or stored outside a secret manager.

## Rollback

- Frontend: promote the previous Vercel deployment (instant).
- Backend: redeploy the previous commit. Migrations are additive; code rollback does not undo data changes, so restore the pre-release backup if a data migration must be reverted.
