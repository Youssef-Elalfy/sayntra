# Staging deployment preparation

**This archive is not production-ready and has not been deployed.** The following is deployment preparation for the current development checkpoint.

## Separate services

- Next.js frontend: a Node-compatible host or Vercel.
- Laravel API: PHP 8.3+ compatible host/VPS with current supported patch releases; web root `backend/public`.
- MySQL 8: managed or privately networked service with backups.
- SMTP: configure and test verification/recovery/invitation delivery.
- Redis is optional. Database cache/queue defaults are provided.

Do not assume a Next.js frontend deployment hosts a persistent PHP process.

## Laravel release

Install dependencies with `composer install --no-dev --prefer-dist --optimize-autoloader`. Supply environment variables through the host secret manager. Set `APP_ENV=production`, `APP_DEBUG=false`, a stable generated `APP_KEY`, database credentials, and HTTPS URLs. Run `php artisan migrate --force` after a verified backup. Cache configuration/routes/views using `php artisan optimize`. Keep storage/framework, storage/logs and bootstrap/cache writable by the application user, not globally writable.

Never expose `.env`, vendor, storage or the repository root. Serve only public assets from `public`. Keep the local demo seeder disabled outside local/testing. Do not enable debug tooling in production.

## Next.js release

From `frontend`, run `npm ci`, `npm run typecheck`, `npm run lint`, and `npm run build`. On a Node host start with `npm run start`. Set API environment values at the appropriate build/runtime stage. All fonts are bundled locally through npm.

## First-party Sanctum domains

Recommended sibling domains: `app.example.com` for Next and `api.example.com` for Laravel, both HTTPS.

- Backend: `APP_URL=https://api.example.com`, `FRONTEND_URL=https://app.example.com`.
- `SANCTUM_STATEFUL_DOMAINS=app.example.com,api.example.com` (hostnames, no schemes).
- `SESSION_DOMAIN=.example.com`, `SESSION_SECURE_COOKIE=true`, HttpOnly session cookie, SameSite=Lax.
- Frontend: `NEXT_PUBLIC_API_URL=https://api.example.com`; configure `API_INTERNAL_URL` for any server-side rewrites used.
- CORS allows only the configured frontend origin with credentials. Do not use wildcard credentialed CORS.
- Browser requests include credentials; the XSRF cookie is intentionally readable, while the actual session cookie is HttpOnly.

For a reverse-proxy deployment using the default same-origin `/api` rewrite, adjust cookie host/domain and stateful hostnames for the public application host. Verify forwarded cookies and headers. Do not mix unrelated frontend/API domains without redesigning the session configuration.

## Processes and monitoring

Current mail notifications are synchronous; queues are configured for future jobs. When jobs are introduced, use supervised `php artisan queue:work --tries=3 --timeout=90` workers and restart them on release (`queue:restart`). Run `php artisan schedule:run` every minute when scheduled tasks exist. Reverb is not installed/enabled in this checkpoint.

Monitor `/api/v1/health`, application error rates, database availability, mail failures and login failures. Do not log passwords, cookies, reset/invitation URLs or customer notes in operational monitoring. Local mail logs contain sensitive capability links: restrict their access and retention.

Back up MySQL and any future private storage, encrypt backups and test restores. Keep APP_KEY backed up securely. Prefer additive migrations; code rollback does not automatically undo data changes. Stop writes and restore a tested backup when data migration rollback is required.

## Release gates still required

Finish the remaining lifecycle modules, test concurrency and all tenant boundaries for new entities, validate actual SMTP, perform accessibility and responsive review, and verify the deployed application before accepting real customer data.
