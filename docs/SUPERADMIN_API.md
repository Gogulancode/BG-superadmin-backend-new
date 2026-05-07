# SuperAdmin API Documentation

This folder contains the OpenAPI/Swagger specifications and API documentation for the BG Accountability SuperAdmin Backend.

## Overview

The SuperAdmin API provides administrative capabilities for managing the multi-tenant BG Accountability platform. Access is restricted to users with the `SUPER_ADMIN` role.

## Base URL

| Environment | URL |
|-------------|-----|
| Local Development | `http://localhost:3003/api/v1` |
| Production | `https://superadmin-api.bridgegaps.app/api/v1` |

## Authentication Flow

### Standard Login
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "superadmin@bridgegaps.app",
  "password": "secure-password"
}
```

### With MFA Enabled
1. Login returns `{ requiresMfa: true, tempToken: "..." }`
2. Complete with MFA code:
```
POST /api/v1/auth/mfa/login
Content-Type: application/json

{
  "tempToken": "eyJhbG...",
  "code": "123456"
}
```

### Using Access Token
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Token Refresh
```
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbG..."
}
```

## Role Requirement

All endpoints require `SUPER_ADMIN` role. Tenant users cannot access this API.

## Files

| File | Description |
|------|-------------|
| `superadmin-openapi.json` | OpenAPI 3.0 specification |
| `SUPERADMIN_API_GUIDE.md` | Detailed endpoint documentation |

## Regenerating the OpenAPI Spec

```bash
npm run generate:openapi
```

## API Modules

### Auth
- Login, logout, token refresh
- MFA enrollment, verification, disable
- Session management

### Tenants
- List, create, update, delete tenants
- View tenant statistics and activity
- Manage tenant status (active/inactive/suspended)

### Templates
- Global metric template library
- Create, update, delete templates
- Assign templates to tenants

### Support
- View tickets across all tenants
- Assign, escalate, resolve tickets
- Support analytics

### Audit
- Platform-wide activity logs
- Filter by user, action, date range
- Export audit reports

### Reports
- Cross-tenant analytics
- Usage reports
- Performance metrics

## Security Features

- JWT-based authentication
- MFA support (TOTP)
- Session tracking and revocation
- Rate limiting
- Audit logging

## Changelog

### v1.0.0 (2025-11-30)
- Initial stable API release
- Full CRUD for tenants, templates, support
- MFA and session management
- Audit logging
- Dashboard analytics
