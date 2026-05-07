# Superadmin Tenant Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Superadmin tenant web operations with the backend tenant API so Tenants and Subscriptions are production-usable.

**Architecture:** Keep backend tenant endpoints unchanged for this slice. Normalize API responses and request payloads in the Superadmin web API client, then remove unsupported page actions.

**Tech Stack:** NestJS, Prisma, Jest, Next.js, React, TanStack Query, TypeScript.

---

### Task 1: Normalize Tenant API Responses

**Files:**
- Modify: `D:\superadmin-app\src\lib\api.ts`

- [ ] Add raw backend tenant response types.
- [ ] Add `normalizeTenant`, `normalizeTenantPage`, and tenant query mapping helpers.
- [ ] Make `getTenants`, `createTenant`, `getTenantById`, `updateTenant`, `activateTenant`, `deactivateTenant`, and `updateTenantSubscription` return normalized frontend tenants.

### Task 2: Align Tenant Hooks

**Files:**
- Modify: `D:\superadmin-app\src\hooks\useTenants.ts`

- [ ] Make tenant list hooks return `PaginatedResponse<Tenant>`.
- [ ] Keep mutation invalidation behavior unchanged.

### Task 3: Polish Tenant Page Unsupported Actions

**Files:**
- Modify: `D:\superadmin-app\app\(platform)\tenants\page.tsx`

- [ ] Remove unsupported delete and reset-password actions from the dropdown.
- [ ] Remove unsupported Suspended status filter.
- [ ] Replace Professional plan option with Pro.
- [ ] Remove `any` usage around tenant credentials.

### Task 4: Align Plan Badge

**Files:**
- Modify: `D:\superadmin-app\src\components\common\StatusBadge.tsx`

- [ ] Use the same plan codes as the API client: `FREE`, `STARTER`, `PRO`, `ENTERPRISE`.

### Task 5: Verify

- [ ] Run `npm run build` in `D:\superadmin-backend`.
- [ ] Run `npm test -- --runInBand src/tenants/tenants.service.spec.ts` in `D:\superadmin-backend`.
- [ ] Run `npm run build` in `D:\superadmin-app`.
- [ ] Start/restart local Superadmin backend and web app.
- [ ] Confirm local web routes return HTTP 200.
