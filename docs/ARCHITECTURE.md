# SAYNTRA architecture — current checkpoint

Laravel 13 lives in `backend`; Next.js App Router and strict TypeScript live in `frontend`. MySQL 8 persists all business records. Browser storage never holds business records or authentication tokens.

## Implemented boundaries

- First-party Sanctum cookie sessions, XSRF protection, explicit credentialed CORS and server-side validation.
- Local browser origin is `http://localhost:3000`; Next rewrites API requests internally to `http://127.0.0.1:8000`. Keep the browser hostname consistent.
- Production requires HTTPS and correctly configured first-party frontend/API domains, stateful domains and secure cookies. This checkpoint has not been deployed.
- Active membership selects organization context in the server session. Tenant models fail closed without context; ownership comes from that context, never a submitted organization ID.
- Fixed role permissions, repair policies, assignment-scoped technician queries and restricted response fields.
- Customers, devices, repairs and repair history use organization-scoped relationships and composite foreign keys. Database transactions protect intake and workflow changes; row locks and expected-status checks protect transition consistency.
- Controllers validate/authorize requests; `RepairWorkflow` owns assignments, diagnosis and guarded transitions; `Audit` records significant mutations.

## Implemented entity relationships

| Entity | Relationship / responsibility |
|---|---|
| organizations | Business identity, defaults and active status |
| users / organization_users | Accounts and organization memberships with role/activation |
| customers | Belong to organization; normalized unique phone within tenant |
| devices | Belong to tenant/customer; repeated repairs retain device history |
| repair_orders | Belong to tenant, customer and device; unique reference and current state |
| repair_assignments | Append assignment events and actor |
| diagnoses | Repair findings, recommendations and author |
| repair_status_histories | Previous/next status, actor, timestamp and note |
| team_invitations | Hashed expiring single-use capability and assigned role |
| activity_logs | Organization-scoped mutation history |
| sessions / password_reset_tokens | Framework authentication persistence |
| cache / jobs / failed_jobs | Framework local cache and queue infrastructure |

Roles and permission sets currently live in `config/sayntra.php`. Custom permission tables/UI are future work. Generic migrations for financial entities have not been added prematurely.

## Implemented pages

Public: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/invite/[token]`, `/privacy`, `/terms`.

Workspace: `/app`, `/app/customers`, `/app/customers/[id]`, `/app/devices`, `/app/devices/[id]`, `/app/repairs`, `/app/repairs/[id]`, `/app/team`, `/app/settings`. Navigation is permission-aware.

API: `/api/v1`; exact endpoints and current response shapes are documented in `API.md`.

## Milestone roadmap

1. M1: frameworks, MySQL schema, authentication/tenancy foundation and brand shell — implemented and checked.
2. M2: bilingual marketing/authentication, themes and onboarding registration — implemented; SMTP delivery and broader onboarding refinements remain.
3. M3: customers, devices, team, repair intake, assignment and diagnosis — implemented; full repair-to-delivery journey remains incomplete.
4. M4: suppliers, inventory/movements, estimates/approvals, invoices/payments/refunds and PDFs — planned, not in this archive.
5. M5: private tracking/attachments, warranties, notifications and reports — planned.
6. M6: complete workflow and concurrent transaction tests, Arabic PDF/accessibility/performance review and production deployment — pending.

For M4, monetary amounts should use integer minor units, explicit rounding and configured tax rates. Stock and financial writes must use transactions, row locks and idempotency keys. These are future design requirements, not existing features.

## Brand

SAYNTRA · صاينترا · Smarter Repairs. Better Business.

Blue `#3B82F6`, teal `#14B8A6`, mint `#2DD4BF`, violet `#8B5CF6`; neutral light and navy dark tokens; Tajawal Arabic and Inter English. Original SVG logos live in `brand`. The Living Network uses transforms/opacity with a reduced-motion static fallback. Dashboard metrics come from the API; marketing previews are labeled examples.

## External dependencies

Mail defaults to the log driver. SMTP delivery, S3, Reverb, production hosting and backups require later configuration/verification. No live payment gateway, SMS, WhatsApp, subscription billing or production deployment is claimed. The PHP backend needs Laravel hosting independently of a Next.js frontend host.
