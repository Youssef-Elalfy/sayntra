# Windows / VS Code setup

## Prerequisites

- PHP 8.3+ (Laravel Herd is suitable). Enable PDO MySQL, mbstring, OpenSSL, tokenizer, XML/DOM, ctype, fileinfo, curl and bcmath.
- Composer 2, Node.js 22/24 LTS, MySQL 8.x. MySQL must be installed and running separately; PHP/Herd alone does not necessarily supply MySQL.
- Open the extracted **sayntra** folder in VS Code. The Laravel root is **backend** (`artisan`, `composer.json`, `routes`, `database`). The Next.js root is **frontend** (`package.json`, `src/app`).

## 1. Database

Create dedicated development and test databases in MySQL Workbench or your MySQL client:

```sql
CREATE DATABASE sayntra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE sayntra_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sayntra'@'localhost' IDENTIFIED BY 'REPLACE_WITH_A_STRONG_LOCAL_PASSWORD';
GRANT ALL PRIVILEGES ON sayntra.* TO 'sayntra'@'localhost';
GRANT ALL PRIVILEGES ON sayntra_test.* TO 'sayntra'@'localhost';
```

Use your configured MySQL account and host. Do not expose port 3306 publicly.

## 2. Backend — PowerShell terminal 1

```powershell
cd backend
composer install
Copy-Item .env.example .env
# Edit DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME and DB_PASSWORD in .env.
php artisan key:generate
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Do not run `migrate:fresh` on a database containing data you need. The setup does not require Python.

## 3. Frontend — PowerShell terminal 2

From the repository root:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Open http://localhost:3000. Use **localhost consistently** in the browser; do not alternate between localhost and 127.0.0.1. The local Next.js rewrites forward `/api/*` and `/sanctum/*` to Laravel, so browser requests remain same origin.

## 4. Email verification

The default `MAIL_MAILER=log` does not deliver mail. Verification/reset links are written to `backend/storage/logs/laravel.log`. Configure an SMTP test inbox or real SMTP before checking mail delivery. Registration creates the organization; email verification is required for workspace operations. The signed verification URL must open in the same browser session.

Optional local owner account (no built-in password):

```powershell
cd backend
$env:DEMO_SEED_PASSWORD = 'CHOOSE_A_UNIQUE_STRONG_PASSWORD_123'
php artisan db:seed
Remove-Item Env:DEMO_SEED_PASSWORD
```

This creates verified local-only `owner@sayntra.test` and `technician@sayntra.test` accounts. Existing passwords are preserved on reseeding. No production data is added by default migrations.

## 5. Workers — additional terminals when queued features are enabled

```powershell
cd backend
php artisan queue:work --tries=3 --timeout=90
```

```powershell
cd backend
php artisan schedule:work
```

Redis is optional; database-backed cache and queue are the local defaults. Reverb must not be presented as enabled until configured and validated.

## 6. Verification

```powershell
cd backend
php artisan test
```

The suite uses **sayntra_test**, never the development database. It includes an isolated-database safety guard. Ensure the test database exists first.

```powershell
cd frontend
npm run typecheck
npm run lint
npm run build
```

## Troubleshooting

- `Could not open input file: artisan`: you are not in `backend`.
- `could not find driver`: enable `pdo_mysql` in the PHP version used by the terminal (`php --ini`).
- `Connection refused`: start MySQL and verify port/host. Start Laravel before calling API routes.
- `419`: use the configured frontend hostname, clear this site's cookies, check stateful domains and restart after changing environment values.
- `403` before workspace access: verify email and active organization membership.
- After `.env` changes: `php artisan config:clear`, then restart the server.
- `npm run dev` starts Next.js. It does not launch a Python preview or install MySQL.
