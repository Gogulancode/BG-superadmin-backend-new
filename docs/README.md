# API Documentation

This folder contains the OpenAPI/Swagger specifications and API documentation for the BG Accountability SuperAdmin Backend.

## Files

| File | Description |
|------|-------------|
| `superadmin-openapi.json` | OpenAPI 3.0 specification (machine-readable) |
| `SUPERADMIN_API.md` | API overview and authentication |
| `SUPERADMIN_API_GUIDE.md` | Detailed endpoint documentation |

## Regenerating the OpenAPI Spec

To regenerate the OpenAPI specification after making changes to the API:

```bash
# From the project root
npm run generate:openapi
```

This will:
1. Bootstrap the NestJS application
2. Extract all Swagger decorators and DTOs
3. Output the spec to `docs/superadmin-openapi.json`

## Using the Spec

### Swagger UI (Development)
When running the backend locally, visit:
```
http://localhost:3003/api/docs
```

### Import into Tools
The `superadmin-openapi.json` file can be imported into:
- **Postman**: Import → OpenAPI
- **Insomnia**: Import/Export → Import Data → From File
- **Stoplight Studio**: Open file
- **Swagger Editor**: File → Import File

## API Versioning

- **Current Version**: `1.0.0`
- **Base Path**: `/api/v1`
- **Breaking changes** require version bump

## Role Requirement

All endpoints (except login) require `SUPER_ADMIN` role.

## Changelog

### v1.0.0 (2025-11-30)
- Initial stable API release
- Tenant CRUD operations
- Template management
- Support ticket management
- Audit logging
- MFA and session management

## Contact

For API questions or issues:
- Email: support@bridgegaps.app
