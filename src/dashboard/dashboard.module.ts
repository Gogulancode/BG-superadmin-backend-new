import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TenantsModule } from '../tenants/tenants.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
	imports: [TenantsModule, PrismaModule],
	controllers: [DashboardController],
	providers: [DashboardService],
})
export class DashboardModule {}
