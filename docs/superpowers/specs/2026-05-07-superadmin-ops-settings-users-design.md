# Superadmin Ops, Settings, and Users Design

## Goal

Complete the Superadmin operational backend contracts that the web app already exposes for production use: system operations, platform settings, and cross-tenant user management.

## Architecture

The backend adds three small Nest modules with clear boundaries:

- `OpsModule` exposes process/database health, environment metadata, telemetry, and rate-limit snapshots.
- `SettingsModule` persists one platform settings row through Prisma and writes an audit event on every update.
- `UsersModule` provides a cross-tenant user directory derived from tenant admin ownership until the tenant product exposes a real user-directory integration.

The web app consumes the real users and settings endpoints instead of keeping those pages as mocked or placeholder-only surfaces.

## Data Contracts

Ops endpoints:

- `GET /api/v1/ops/health` is public for uptime monitoring.
- `GET /api/v1/ops/environment`, `/rate-limits`, and `/telemetry` require a Superadmin JWT.

Settings endpoints:

- `GET /api/v1/superadmin/settings` returns platform defaults and feature flags.
- `PATCH /api/v1/superadmin/settings` accepts partial updates and merges nested plan limits/features with existing values.

Users endpoints:

- `GET /api/v1/superadmin/users` supports pagination, tenant, role, status, and search filters.
- `GET /api/v1/superadmin/users/stats` returns the summary cards used by the Superadmin user page.

## Persistence

The existing database had no Prisma migration history, so the repo now includes:

- A baseline migration for the previously existing schema.
- A forward migration for `platform_settings` plus the `SETTINGS_CHANGED` audit event.

Existing environments should mark the baseline migration as applied before deploying forward migrations.

## Testing

Service tests cover the backend behavior:

- Ops health/rate-limit payload shape.
- Settings defaults, merge persistence, and audit logging.
- Cross-tenant user listing/status mapping and stats.
