# Superadmin Ops, Settings, and Users Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Superadmin backend support for operations, settings, and cross-tenant user management.

**Architecture:** Add focused Nest modules for ops, settings, and users. Persist settings with Prisma, derive current cross-tenant users from tenant admin ownership, and connect the Superadmin web pages to the real endpoints.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Jest, Next.js, TanStack Query.

---

### Task 1: Ops Backend Module

**Files:**
- Create: `src/ops/ops.module.ts`
- Create: `src/ops/ops.controller.ts`
- Create: `src/ops/ops.service.ts`
- Test: `src/ops/ops.service.spec.ts`

- [x] Add RED tests for health and rate-limit payloads.
- [x] Implement `OpsService` health, environment, telemetry, and rate-limit methods.
- [x] Expose `GET /ops/health` publicly and protect other ops endpoints.
- [x] Verify with `npm test -- --runInBand src/ops/ops.service.spec.ts`.

### Task 2: Settings Backend Module

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260506000000_baseline/migration.sql`
- Create: `prisma/migrations/20260507000000_add_platform_settings/migration.sql`
- Create: `src/settings/settings.module.ts`
- Create: `src/settings/settings.controller.ts`
- Create: `src/settings/settings.service.ts`
- Create: `src/settings/dto/update-platform-settings.dto.ts`
- Test: `src/settings/settings.service.spec.ts`

- [x] Add RED tests for default settings and partial update merge behavior.
- [x] Add `PlatformSettings` persistence and `SETTINGS_CHANGED` audit event.
- [x] Implement `GET` and `PATCH /superadmin/settings`.
- [x] Apply local migration after resolving the baseline.

### Task 3: Cross-Tenant Users Backend Module

**Files:**
- Create: `src/users/users.module.ts`
- Create: `src/users/users.controller.ts`
- Create: `src/users/users.service.ts`
- Create: `src/users/dto/user-query.dto.ts`
- Test: `src/users/users.service.spec.ts`

- [x] Add RED tests for paginated tenant admin users and inactive status mapping.
- [x] Implement list and stats endpoints.
- [x] Support tenant, role, status, and search filters.

### Task 4: Superadmin Web Wiring

**Files:**
- Modify: `D:\superadmin-app\src\lib\api.ts`
- Modify: `D:\superadmin-app\src\hooks\useUsers.ts`
- Modify: `D:\superadmin-app\app\(platform)\settings\page.tsx`

- [x] Add `getCrossTenantUserStats`.
- [x] Replace mocked user derivation with real backend users/stats calls.
- [x] Connect Settings page to real platform settings query and update mutation.

### Task 5: Verification

- [x] Run backend unit tests: `npm test -- --runInBand`.
- [x] Run backend build: `npm run build`.
- [x] Run Superadmin web build: `npm run build`.
- [x] Smoke test local ops/settings/users endpoints with a Superadmin token.
- [x] Smoke test Superadmin web routes `/ops`, `/settings`, and `/users`.
