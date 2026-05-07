# SuperAdmin API Guide

Complete endpoint reference for the BG Accountability SuperAdmin API.

**Base URL:** `https://superadmin-api.bridgegaps.app/api/v1`  
**Authentication:** Bearer Token (JWT) - `SUPER_ADMIN` role required

---

## Table of Contents

1. [Authentication](#authentication)
2. [MFA Management](#mfa-management)
3. [Session Management](#session-management)
4. [Tenant Management](#tenant-management)
5. [Dashboard & Analytics](#dashboard--analytics)
6. [Templates](#templates)
7. [Support Tickets](#support-tickets)
8. [Audit Logs](#audit-logs)
9. [Reports](#reports)

---

## Authentication

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "superadmin@bridgegaps.app",
  "password": "secureAdminPassword"
}
```

**Response (No MFA):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "admin-uuid",
    "email": "superadmin@bridgegaps.app",
    "name": "Super Admin",
    "role": "SUPER_ADMIN"
  }
}
```

**Response (MFA Required):**
```json
{
  "requiresMfa": true,
  "tempToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "admin-uuid",
    "email": "superadmin@bridgegaps.app",
    "name": "Super Admin"
  }
}
```

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

---

## MFA Management

### Get MFA Status

```http
GET /auth/mfa/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "isMfaEnabled": true,
  "lastMfaVerifiedAt": "2025-11-30T10:00:00Z"
}
```

### Enroll MFA

```http
POST /auth/mfa/enroll
Authorization: Bearer <token>
```

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "otpauthUrl": "otpauth://totp/BG%20Accountability:admin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=BG%20Accountability",
  "qrCode": "data:image/png;base64,..."
}
```

### Verify & Enable MFA

```http
POST /auth/mfa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "123456"
}
```

### Disable MFA

```http
POST /auth/mfa/disable
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "123456",
  "password": "currentPassword"
}
```

### Complete MFA Login

```http
POST /auth/mfa/login
Content-Type: application/json

{
  "tempToken": "eyJhbGciOiJIUzI1NiIs...",
  "code": "123456"
}
```

---

## Session Management

### List Active Sessions

```http
GET /auth/sessions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-uuid",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      "ipAddress": "192.168.1.100",
      "createdAt": "2025-11-30T09:00:00Z",
      "lastActiveAt": "2025-11-30T15:30:00Z",
      "isCurrent": true
    },
    {
      "id": "session-uuid-2",
      "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)...",
      "ipAddress": "10.0.0.50",
      "createdAt": "2025-11-29T14:00:00Z",
      "lastActiveAt": "2025-11-29T18:00:00Z",
      "isCurrent": false
    }
  ],
  "total": 2
}
```

### Revoke Session

```http
DELETE /auth/sessions/:sessionId
Authorization: Bearer <token>
```

### Revoke All Other Sessions

```http
DELETE /auth/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "keepCurrent": true
}
```

---

## Tenant Management

### List Tenants

```http
GET /tenants?page=1&pageSize=20&status=ACTIVE
Authorization: Bearer <token>
```

**Response:**
```json
{
  "items": [
    {
      "id": "tenant-uuid",
      "name": "Acme Corporation",
      "email": "admin@acme.com",
      "domain": "acme.com",
      "status": "ACTIVE",
      "plan": "PRO",
      "usersCount": 15,
      "createdAt": "2025-01-15T10:00:00Z",
      "lastActiveAt": "2025-11-30T14:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 20
}
```

### Get Tenant Details

```http
GET /tenants/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "tenant-uuid",
  "name": "Acme Corporation",
  "email": "admin@acme.com",
  "domain": "acme.com",
  "status": "ACTIVE",
  "plan": "PRO",
  "businessType": "STARTUP",
  "industry": "Technology",
  "usersCount": 15,
  "metricsCount": 25,
  "outcomesCount": 120,
  "momentumScore": 82,
  "isOnboarded": true,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-11-30T14:00:00Z"
}
```

### Create Tenant

```http
POST /tenants
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Company",
  "email": "admin@newcompany.com",
  "domain": "newcompany.com",
  "plan": "STARTER",
  "adminName": "John Smith",
  "adminPassword": "initialPassword123"
}
```

### Update Tenant

```http
PATCH /tenants/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Company Name",
  "plan": "PRO",
  "status": "ACTIVE"
}
```

### Suspend Tenant

```http
POST /tenants/:id/suspend
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Payment overdue"
}
```

### Reactivate Tenant

```http
POST /tenants/:id/reactivate
Authorization: Bearer <token>
```

### Delete Tenant

```http
DELETE /tenants/:id
Authorization: Bearer <token>
```

⚠️ **Warning:** This is a destructive operation. All tenant data will be permanently deleted.

### Get Tenant Statistics

```http
GET /tenants/:id/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "users": {
    "total": 15,
    "active": 12,
    "byRole": {
      "TENANT_ADMIN": 2,
      "MANAGER": 3,
      "STAFF": 10
    }
  },
  "metrics": {
    "total": 25,
    "logged": 1250
  },
  "outcomes": {
    "total": 120,
    "completed": 95,
    "completionRate": 79.2
  },
  "momentum": {
    "current": 82,
    "average30d": 78,
    "trend": "UP"
  }
}
```

---

## Dashboard & Analytics

### Get Platform Summary

```http
GET /dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalTenants": 150,
  "activeTenants": 142,
  "inactiveTenants": 8,
  "createdLast7Days": 5,
  "totalUsers": 2500,
  "totalMetrics": 3500,
  "totalOutcomes": 15000,
  "openSupportTickets": 12,
  "activityTrend": [
    { "date": "2025-11-24", "activeTenants": 140 },
    { "date": "2025-11-25", "activeTenants": 138 }
  ],
  "tenantGrowthSeries": [
    { "month": "2025-01", "count": 120 },
    { "month": "2025-02", "count": 128 }
  ],
  "topTenantsByActivity": [
    { "tenantName": "Acme Corp", "activityCount": 450 },
    { "tenantName": "TechStart", "activityCount": 380 }
  ]
}
```

---

## Templates

### List Templates

```http
GET /templates?scope=GLOBAL&category=SALES
Authorization: Bearer <token>
```

**Response:**
```json
{
  "items": [
    {
      "id": "template-uuid",
      "name": "Monthly Revenue",
      "description": "Track monthly recurring revenue",
      "category": "FINANCIAL",
      "scope": "GLOBAL",
      "isActive": true,
      "usageCount": 45
    }
  ],
  "total": 25
}
```

### Create Template

```http
POST /templates
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Customer Churn Rate",
  "description": "Monthly customer churn percentage",
  "category": "CUSTOMER",
  "unit": "%",
  "targetDirection": "DOWN",
  "scope": "GLOBAL"
}
```

### Update Template

```http
PATCH /templates/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Template Name",
  "isActive": true
}
```

### Delete Template

```http
DELETE /templates/:id
Authorization: Bearer <token>
```

### Assign Template to Tenant

```http
POST /templates/:id/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "tenantId": "tenant-uuid"
}
```

---

## Support Tickets

### List All Tickets

```http
GET /support/tickets?status=OPEN&priority=HIGH
Authorization: Bearer <token>
```

**Response:**
```json
{
  "items": [
    {
      "id": "ticket-uuid",
      "subject": "Cannot login",
      "description": "Getting invalid credentials error",
      "status": "OPEN",
      "priority": "HIGH",
      "category": "BUG",
      "tenantId": "tenant-uuid",
      "tenantName": "Acme Corp",
      "createdBy": "user-uuid",
      "createdByName": "John Doe",
      "assignedTo": null,
      "createdAt": "2025-11-30T10:00:00Z"
    }
  ],
  "total": 12
}
```

### Get Ticket Details

```http
GET /support/tickets/:id
Authorization: Bearer <token>
```

### Assign Ticket

```http
POST /support/tickets/:id/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "assigneeId": "admin-uuid"
}
```

### Update Ticket Status

```http
PATCH /support/tickets/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "priority": "URGENT"
}
```

### Add Internal Note

```http
POST /support/tickets/:id/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Escalated to engineering team",
  "isInternal": true
}
```

### Resolve Ticket

```http
POST /support/tickets/:id/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "resolution": "Issue was caused by expired session. User advised to re-login."
}
```

---

## Audit Logs

### List Audit Events

```http
GET /audit?page=1&pageSize=50&eventType=USER_LOGIN&startDate=2025-11-01
Authorization: Bearer <token>
```

**Response:**
```json
{
  "items": [
    {
      "id": "audit-uuid",
      "eventType": "USER_LOGIN",
      "userId": "user-uuid",
      "userEmail": "user@example.com",
      "tenantId": "tenant-uuid",
      "tenantName": "Acme Corp",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "metadata": {
        "mfaUsed": true
      },
      "createdAt": "2025-11-30T10:00:00Z"
    }
  ],
  "total": 1500
}
```

### Event Types

| Event Type | Description |
|------------|-------------|
| `USER_LOGIN` | User logged in |
| `USER_LOGOUT` | User logged out |
| `USER_CREATED` | New user created |
| `USER_UPDATED` | User profile updated |
| `USER_DELETED` | User deleted |
| `TENANT_CREATED` | New tenant created |
| `TENANT_UPDATED` | Tenant updated |
| `TENANT_SUSPENDED` | Tenant suspended |
| `TENANT_DELETED` | Tenant deleted |
| `MFA_ENABLED` | MFA enabled |
| `MFA_DISABLED` | MFA disabled |
| `PASSWORD_CHANGED` | Password changed |
| `SESSION_REVOKED` | Session revoked |

### Export Audit Logs

```http
GET /audit/export?format=csv&startDate=2025-11-01&endDate=2025-11-30
Authorization: Bearer <token>
```

---

## Reports

### Generate Tenant Report

```http
GET /reports/tenant/:tenantId?period=30d
Authorization: Bearer <token>
```

**Response:**
```json
{
  "tenant": {
    "id": "tenant-uuid",
    "name": "Acme Corp"
  },
  "period": {
    "start": "2025-11-01",
    "end": "2025-11-30"
  },
  "summary": {
    "activeDays": 25,
    "metricsLogged": 450,
    "outcomesCompleted": 35,
    "reviewsSubmitted": 20,
    "avgMomentumScore": 78
  },
  "trends": {
    "momentum": [75, 78, 80, 76, 82],
    "activity": [15, 18, 12, 20, 16]
  }
}
```

### Generate Platform Report

```http
GET /reports/platform?period=monthly&year=2025&month=11
Authorization: Bearer <token>
```

### Schedule Report

```http
POST /reports/schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "PLATFORM_SUMMARY",
  "frequency": "WEEKLY",
  "recipients": ["admin@bridgegaps.app"],
  "format": "PDF"
}
```

---

## Required Headers

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer <access_token>` | Yes (except login) |
| `Content-Type` | `application/json` | Yes (for POST/PATCH) |

---

## cURL Examples

### Login
```bash
curl -X POST https://superadmin-api.bridgegaps.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bridgegaps.app","password":"password"}'
```

### List Tenants
```bash
curl https://superadmin-api.bridgegaps.app/api/v1/tenants \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Create Tenant
```bash
curl -X POST https://superadmin-api.bridgegaps.app/api/v1/tenants \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"name":"New Corp","email":"admin@newcorp.com","plan":"STARTER"}'
```
