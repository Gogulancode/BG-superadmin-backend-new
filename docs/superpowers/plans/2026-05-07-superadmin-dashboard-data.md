# Superadmin Dashboard Production Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Superadmin dashboard fallback/mock data with real backend aggregates.

**Architecture:** Extend `DashboardService` to aggregate tenant usage, support tickets, and audit rows through Prisma while preserving the existing `GET /superadmin/dashboard/summary` route. Update web types and charts to consume the real API shape.

**Tech Stack:** NestJS, Prisma, Jest, Next.js, Recharts.

---

### Task 1: Backend Summary Contract

**Files:**
- Modify: `src/dashboard/dashboard.service.ts`
- Modify: `src/dashboard/dashboard.module.ts`
- Modify: `src/dashboard/dto/dashboard-summary.dto.ts`
- Test: `src/dashboard/dashboard.service.spec.ts`

- [x] Write RED tests for complete summary payload fields.
- [x] Add Prisma-backed totals for users, metrics, outcomes, support tickets, growth, and top tenant activity.
- [x] Update Swagger DTOs and examples.
- [x] Verify with `npm test -- --runInBand src/dashboard/dashboard.service.spec.ts`.

### Task 2: Dashboard Drill-Down Lists

**Files:**
- Modify: `src/dashboard/dashboard.controller.ts`
- Modify: `src/dashboard/dashboard.service.ts`
- Test: `src/dashboard/dashboard.service.spec.ts`

- [x] Replace placeholder support list with recent support tickets.
- [x] Replace placeholder audit list with recent audit logs.
- [x] Keep both endpoints protected by Superadmin JWT and role guards.

### Task 3: Frontend Contract Cleanup

**Files:**
- Modify: `D:\superadmin-app\src\lib\api.ts`
- Modify: `D:\superadmin-app\app\(platform)\dashboard\page.tsx`
- Modify: `D:\superadmin-app\src\hooks\useAnalytics.ts`
- Modify: `D:\superadmin-app\app\(platform)\analytics\page.tsx`

- [x] Update `TenantGrowthPoint` and `TopTenantActivity` to the production field names.
- [x] Remove dashboard mock chart fallbacks.
- [x] Update analytics to read `activityScore`.

### Task 4: Verification

- [x] Run backend tests: `npm test -- --runInBand`.
- [x] Run backend build: `npm run build`.
- [x] Run Superadmin web build: `npm run build`.
- [x] Smoke test dashboard summary/support/audit endpoints.
- [x] Smoke test `/dashboard` and `/analytics` web routes.
