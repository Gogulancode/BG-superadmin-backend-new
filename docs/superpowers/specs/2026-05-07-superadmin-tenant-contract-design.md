# Superadmin Tenant Contract Design

## Goal
Make the Superadmin tenant management experience production-usable by aligning the web app with the backend tenant API contract and removing unsupported UI actions from the first production surface.

## Current Context
The Superadmin backend exposes tenant lifecycle routes for list, create, view, edit, activate, deactivate, subscription update, and usage stats. The backend returns paginated data as `{ data, meta }` and represents subscription fields as `subscriptionStatus`, `planCode`, `renewalDate`, and `trialEndsAt`.

The Superadmin web app currently expects a different client model: flat pagination fields, a `plan` field, frontend-only `domain`, unsupported `SUSPENDED` tenant status, and visible tenant delete/reset-password actions whose backend endpoints do not exist.

## Design
The first production slice will make tenant management reliable without expanding backend scope unnecessarily:
- Normalize backend tenant responses inside `src/lib/api.ts`.
- Map backend `meta` pagination to the frontend `PaginatedResponse` shape.
- Convert frontend plan filters to backend `planCode` filters.
- Convert onboarding filters to backend `isOnboarded`.
- Map frontend plan changes to backend subscription payloads.
- Keep tenant creation and edit focused on backend-supported fields.
- Remove visible delete and reset-password actions from the Tenants page until a safe cross-system account-management design exists.
- Use `FREE`, `STARTER`, `PRO`, and `ENTERPRISE` consistently across Superadmin web.

## Non-Goals
This slice does not add tenant deletion, cross-tenant user management, platform settings, or ops endpoints. Those are separate production slices because they need backend data model and security decisions.

## Verification
Run backend build, frontend build, and tenant service tests. Start Superadmin backend and web locally and confirm the app routes serve.
