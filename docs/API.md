# REST API — implemented checkpoint

Base: `/api/v1`. JSON requests use `Accept: application/json`. Writes use JSON plus the XSRF header/cookie for browser sessions. First call `/sanctum/csrf-cookie`; requests include credentials. Never store session tokens in localStorage.

## Authentication and onboarding

| Method | Route | Behavior |
|---|---|---|
| POST | /auth/register | name, email, password, password_confirmation, organization_name, category, country=EG, optional phone/language. Creates owner/workspace atomically. |
| POST | /auth/login | email, password, optional remember; regenerates session |
| GET | /auth/user | Current user and memberships |
| POST | /auth/logout | Invalidates session |
| POST | /auth/forgot-password | email; generic response |
| POST | /auth/reset-password | token, email, password, password_confirmation |
| PATCH | /auth/profile | name, language=en/ar, theme=light/dark/system |
| POST | /auth/password | current_password, password, password_confirmation |
| POST | /auth/email/verification-notification | Resend verification link; authenticated |
| GET | /auth/verify-email/{id}/{hash} | Authenticated signed verification link |
| GET | /invitations/{token} | Read valid invitation capability |
| POST | /invitations/{token}/accept | New user: name, password, password_confirmation. Existing user: must sign in as invited email. |

Use `php artisan route:list --path=api` for the exact route inventory.

## Workspace resources

Workspace endpoints require authentication, verified email, active membership/organization and the relevant role permission. Organization selection comes from the server-side session; clients cannot select arbitrary tenant IDs through request payloads.

- `GET /health`: database connectivity check.
- `GET/PATCH /organization`: current organization and authorized settings.
- `GET /dashboard`: persisted counts, status grouping, recent repairs and activity; technician queries are assignment-limited.
- `GET/POST /customers`, `GET/PATCH/DELETE /customers/{id}`. Required creation fields: name, phone. Phone is normalized and unique within organization. Archive blocked while active repairs exist.
- `GET/POST /devices`, `GET/PATCH /devices/{id}`. Required: customer_id, category, brand, model. Optional serial_number, description, specifications. Customer must belong to same organization. Existing repair history blocks transfer to another customer.
- `GET/POST /repairs`, `GET/PATCH /repairs/{id}`. Required creation: device_id, reported_problem, device_condition. Optional priority, accessories, expected_at. Customer derives from the scoped device.
- `POST /repairs/{id}/assign`: technician_id must be an active technician of the workspace.
- `POST /repairs/{id}/diagnosis`: findings, recommended_work; allowed repair stage/assignment enforced.
- `POST /repairs/{id}/transition`: status, expected_status, optional note; ready_for_pickup additionally requires quality_check_notes. Stale state returns 409. Arbitrary transitions are rejected.
- `GET /repairs/{id}/timeline`: audit events, scoped and authorized.
- `GET /technicians`: active technician names and workload.
- `GET /team`, `POST /team/invitations` (email, role), `PATCH /team/{membership_id}` (role, active).

## Responses and errors

Most single resources use `{ "data": ... }`. List endpoints are paginated at 20 records. Repair collections use Laravel Resource `meta`; other collections use paginator `current_page`, `last_page`, `total`. Consumers must handle that documented difference.

`search` is supported on customer name/phone, device brand/model and repair reference. Repairs additionally accept `status` and `priority`. Page selection uses `page`.

- 201 created; 200 retrieved/updated; 204 logout/archive.
- 401 unauthenticated; 403 role, membership or verification failure.
- 404 missing resource, including records outside the organization boundary.
- 409 stale repair status; 422 validation/business rule error; 429 rate limit.
- Validation: `{ "message": "...", "errors": { "field": ["..."] } }`.

Financial, inventory, PDF, attachment and customer tracking endpoints are not included in this checkpoint.
