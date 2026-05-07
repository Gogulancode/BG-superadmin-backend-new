import { Module } from '@nestjs/common';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
	imports: [TenantsModule],
	controllers: [SuperadminController],
	providers: [SuperadminService],
})
export class SuperadminModule {}
