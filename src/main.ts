import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:3001,http://localhost:3011')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(helmet());

  // Enable CORS
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization',
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('BG Accountability SuperAdmin API')
    .setDescription('REST API for SuperAdmin Dashboard - Tenant Management & Platform Analytics')
    .setVersion('1.0.0')
    .setContact('BG Accountability', 'https://bridgegaps.app', 'support@bridgegaps.app')
    .addServer('http://localhost:3003', 'Local Development')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token (SUPER_ADMIN role required)',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'SuperAdmin authentication and session management')
    .addTag('Auth - MFA', 'Multi-factor authentication management')
    .addTag('Tenants', 'Tenant lifecycle management')
    .addTag('Dashboard', 'Platform-wide analytics & summary')
    .addTag('Support', 'Cross-tenant support ticket management')
    .addTag('Audit', 'Platform audit trail')
    .addTag('Templates', 'Global template library')
    .addTag('Reports', 'Cross-tenant reporting')
    .addTag('Ops', 'Operational health, telemetry, and rate-limit snapshots')
    .addTag('Settings', 'Platform settings')
    .addTag('Users', 'Cross-tenant user directory')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, doc);

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`🚀 SuperAdmin API running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
