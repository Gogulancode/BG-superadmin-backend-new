/**
 * OpenAPI/Swagger Spec Generator for SuperAdmin Backend
 *
 * Generates a JSON file of the OpenAPI specification for the SuperAdmin API.
 *
 * Usage: npm run generate:openapi
 * Output: ./docs/superadmin-openapi.json
 */

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generateOpenApiSpec() {
  console.log('🔧 Bootstrapping NestJS application...');

  // Create application in standalone mode (no HTTP listener)
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  // Set global prefix to match production
  app.setGlobalPrefix('api/v1');

  // Build Swagger document
  const config = new DocumentBuilder()
    .setTitle('BG Accountability SuperAdmin API')
    .setDescription(
      `REST API for the BG Accountability Platform - SuperAdmin Services.

## Overview
This API provides administrative capabilities for managing the multi-tenant platform.
Access is restricted to users with the \`SUPER_ADMIN\` role.

## Authentication
All endpoints (except login) require a valid JWT Bearer token.
- Login via \`POST /api/v1/auth/login\`
- Include token in header: \`Authorization: Bearer <token>\`
- Refresh tokens via \`POST /api/v1/auth/refresh\`

## Multi-Factor Authentication (MFA)
SuperAdmin accounts require MFA for enhanced security.
- If MFA is enabled, login returns a \`tempToken\`
- Complete MFA via \`POST /api/v1/auth/mfa/login\` with tempToken + TOTP code
- MFA can be managed via \`/api/v1/auth/mfa/*\` endpoints

## Session Management
- View active sessions: \`GET /api/v1/auth/sessions\`
- Revoke sessions: \`DELETE /api/v1/auth/sessions/:id\`

## Rate Limiting
- Default: 100 requests per minute per IP
- Auth endpoints: 10 requests per minute per IP

## Error Format
All errors follow: \`{ success: false, message: string, code?: string, details?: object }\`

## Pagination
Paginated endpoints use: \`{ items: T[], total: number, page: number, pageSize: number }\`
`,
    )
    .setVersion('1.0.0')
    .setContact('BG Accountability', 'https://bridgegaps.app', 'support@bridgegaps.app')
    .setLicense('Proprietary', '')
    .addServer('http://localhost:3003', 'Local Development')
    .addServer('https://superadmin-api.bridgegaps.app', 'Production')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token (SUPER_ADMIN role required)',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication, MFA, and session management')
    .addTag('Auth - MFA', 'Multi-factor authentication management')
    .addTag('Tenants', 'Tenant lifecycle management')
    .addTag('Dashboard', 'Platform-wide analytics and KPIs')
    .addTag('Templates', 'Global metric template library')
    .addTag('Support', 'Support ticket management across all tenants')
    .addTag('Audit', 'Platform audit trail and activity logs')
    .addTag('Reports', 'Cross-tenant reporting and analytics')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => {
      return `${controllerKey}_${methodKey}`;
    },
  });

  // Ensure docs directory exists
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
    console.log('📁 Created docs/ directory');
  }

  // Write OpenAPI spec to file
  const outputPath = path.join(docsDir, 'superadmin-openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf8');

  console.log('✅ OpenAPI specification generated successfully!');
  console.log(`📄 Output: ${outputPath}`);
  console.log(`📊 Paths: ${Object.keys(document.paths).length} endpoints`);
  console.log(`🏷️  Tags: ${document.tags?.length || 0} tags`);

  // Print summary of endpoints by tag
  const endpointsByTag: Record<string, number> = {};
  for (const pathObj of Object.values(document.paths)) {
    for (const method of Object.values(pathObj as Record<string, any>)) {
      if (method.tags) {
        for (const tag of method.tags) {
          endpointsByTag[tag] = (endpointsByTag[tag] || 0) + 1;
        }
      }
    }
  }
  console.log('\n📈 Endpoints by tag:');
  for (const [tag, count] of Object.entries(endpointsByTag).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${tag}: ${count}`);
  }

  await app.close();
  console.log('\n🎉 Done!');
}

generateOpenApiSpec().catch((error) => {
  console.error('❌ Failed to generate OpenAPI spec:', error);
  process.exit(1);
});
