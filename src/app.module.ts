import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { SupportModule } from './support/support.module';
import { TemplatesModule } from './templates/templates.module';
import { ReportsModule } from './reports/reports.module';
import { OpsModule } from './ops/ops.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { optionalNumberEnv } from './config/env';

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        ttl: optionalNumberEnv('THROTTLE_TTL_MS', 60_000),
        limit: optionalNumberEnv('THROTTLE_LIMIT', 120),
      },
    ]),
    AuthModule,
    TenantsModule,
    DashboardModule,
    AuditModule,
    SupportModule,
    TemplatesModule,
    ReportsModule,
    OpsModule,
    SettingsModule,
    UsersModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
