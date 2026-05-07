import { Injectable } from '@nestjs/common';
import { TenantsService } from '../tenants/tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class SuperadminService {
  constructor(private tenantsService: TenantsService) {}

  createTenant(dto: CreateTenantDto) {
    return this.tenantsService.createTenant(dto);
  }

  listTenants() {
    return this.tenantsService.listTenants();
  }

  getTenant(id: string) {
    return this.tenantsService.getTenant(id);
  }

  activateTenant(id: string) {
    return this.tenantsService.activateTenant(id);
  }

  deactivateTenant(id: string) {
    return this.tenantsService.deactivateTenant(id);
  }

  tenantStats(id: string) {
    return this.tenantsService.getTenantStats(id);
  }
}
