# Roles and tenant boundaries

Effective permission definitions live in `backend/config/sayntra.php`. These are fixed role presets in this checkpoint, not a custom permission editor.

| Role | Current working access |
|---|---|
| Owner | Organization settings, team invitations/membership, all current operational modules |
| Manager | Customer/device/repair operations and assignment, without organization/team administration |
| Receptionist | Customer/device intake and repair intake; no diagnosis or unrestricted financial access |
| Technician | Assigned repairs only, diagnosis and permitted technical transitions; customer contact and sensitive device identifiers excluded from repair responses |
| Inventory manager | Reserved inventory permissions; inventory workflows not yet delivered |
| Accountant | Reserved finance/report permissions; financial workflows not yet delivered |

Platform-admin flag is protected from ordinary account mass assignment and grants no implicit tenant bypass. A platform administration UI is not included. Staff invitation tokens are hashed at rest and expire after 72 hours. At least one active owner must remain; active technician work must be reassigned before membership changes.

Tenant queries fail closed without `TenantContext`. Tenant-owned models add a global organization scope and enforce ownership on creation/update. Device/customer and repair/customer/device associations use composite organization foreign keys. Controllers validate associated IDs within the active organization. Sensitive repair actions also use policies.

API authorization is authoritative. Hiding a navigation entry is not treated as access control. Automated tests cover cross-organization reads/writes and invalid associations.
