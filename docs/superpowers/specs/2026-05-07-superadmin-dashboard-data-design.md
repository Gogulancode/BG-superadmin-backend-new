# Superadmin Dashboard Production Data Design

## Goal

Make the Superadmin dashboard depend on real backend aggregates instead of frontend fallback data.

## Scope

The dashboard summary endpoint now returns the full contract already used by the Superadmin web app:

- Tenant totals and active/inactive counts.
- New tenants in the last seven days.
- Derived total tenant-admin users.
- Platform-wide metrics and outcomes from tenant usage snapshots.
- Open and in-progress support ticket count.
- Seven-day tenant activity trend.
- Six-month tenant growth series.
- Top tenants by activity score.

The dashboard support and audit drill-down endpoints now return recent real rows instead of placeholders.

## Data Rules

Tenant user counts are derived as one admin owner per tenant until the tenant product exposes a complete user directory. Activity score is a compact aggregate of `metricsLogged`, `activitiesLogged`, and `salesLogged` from `usageSummary`.

## Frontend Contract

The Superadmin web dashboard no longer creates mock chart data. It renders `tenantGrowthSeries` and `topTenantsByActivity` from the API. Analytics uses the same `activityScore` field.
