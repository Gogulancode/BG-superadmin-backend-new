import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SuperadminService } from './superadmin.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('SuperAdmin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('superadmin')
export class SuperadminController {
  constructor(private superadminService: SuperadminService) {}

  @ApiOperation({ summary: 'List tenants' })
  @Get('tenants')
  listTenants() {
    return this.superadminService.listTenants();
  }

  @ApiOperation({ summary: 'Create tenant' })
  @Post('tenants')
  createTenant(@Body() dto: CreateTenantDto) {
    return this.superadminService.createTenant(dto);
  }

  @ApiOperation({ summary: 'Get tenant details' })
  @Get('tenants/:id')
  getTenant(@Param('id') id: string) {
    return this.superadminService.getTenant(id);
  }

  @ApiOperation({ summary: 'Activate tenant' })
  @Patch('tenants/:id/activate')
  activateTenant(@Param('id') id: string) {
    return this.superadminService.activateTenant(id);
  }

  @ApiOperation({ summary: 'Deactivate tenant' })
  @Patch('tenants/:id/deactivate')
  deactivateTenant(@Param('id') id: string) {
    return this.superadminService.deactivateTenant(id);
  }

  @ApiOperation({ summary: 'Get tenant usage stats' })
  @Get('tenants/:id/stats')
  getTenantStats(@Param('id') id: string) {
    return this.superadminService.tenantStats(id);
  }
}
