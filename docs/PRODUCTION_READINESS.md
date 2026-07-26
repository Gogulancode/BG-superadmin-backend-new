# Superadmin Production Readiness

## Canonical Services

- Superadmin backend: `D:\superadmin-backend`
- Superadmin web: `D:\superadmin-app`
- Tenant backend: `D:\BGAccountabiityapp`
- Tenant web: `D:\bridge-gaps-dashboard-main`
- Mobile app: `D:\BG-mobile-app`

The `src/superadmin` module inside the tenant backend is legacy overlap. Do not add new Superadmin features there. Keep new Superadmin work in `D:\superadmin-backend`, then remove the tenant-backend duplicate in a separate cleanup once staging is stable.

## Required Environment

`JWT_SECRET` must be a unique random value with at least 32 characters. Do not use placeholders such as `secret`, `jwt-secret`, or the value from `.env.example`.

Required deployment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_ORIGINS`
- `TENANT_APP_URL`

`TENANT_APP_URL` powers tenant activation links returned after Superadmin creates a tenant. It should point to the tenant web staging or production URL, not the Superadmin URL.

## Tenant Activation Flow

Superadmin does not generate or show temporary passwords.

When a tenant is created, Superadmin returns:

- `adminEmail`
- `loginUrl`
- `onboardingUrl`
- `passwordDelivery`

Share the onboarding URL with the tenant admin. The tenant admin creates or resets their own password through the tenant app flow.

## Staging Smoke Checklist

1. Login to Superadmin.
2. Create a tenant and verify the activation dialog shows no password.
3. Open the tenant onboarding URL and confirm tenant registration/onboarding can continue.
4. Create and update a support ticket.
5. Create, edit, duplicate, and deactivate a template.
6. Check tenants, users, subscriptions, audit, reports, settings, and ops pages load without API errors.

## Cleanup Backlog

- Remove legacy tenant-backend `src/superadmin` after all staging routes point to `D:\superadmin-backend`.
- Replace any remaining hand-written staging credentials with seeded/reset flows.
- Add deployment smoke automation once staging URLs are stable.
