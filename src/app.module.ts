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

@Module({
  imports: [
    PrismaModule,
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
  providers: [],
})
export class AppModule {}
