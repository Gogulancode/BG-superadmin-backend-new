import { Controller, Get, Param, UseGuards, Post, Body, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { TenantStatsDto } from './dto/tenant-stats.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { TenantQueryDto } from './dto/tenant-query.dto';

@ApiTags('Tenants')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('superadmin/tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'List tenants with filters and pagination' })
  @ApiOkResponse({
    description: 'Paginated tenant collection',
    schema: {
      example: {
        data: [
          {
            id: 'tenant_123',
            name: 'Acme Corp',
            email: 'owner@acme.com',
            status: 'ACTIVE',
            isOnboarded: true,
            onboardedAt: '2025-05-02T12:00:00.000Z',
            createdAt: '2025-05-01T12:34:56.000Z',
            updatedAt: '2025-05-02T12:34:56.000Z',
            lastActiveAt: '2025-05-04T09:15:00.000Z',
          },
        ],
        meta: {
          page: 1,
          pageSize: 20,
          total: 42,
          totalPages: 3,
        },
      },
    },
  })
  listTenants(@Query() query: TenantQueryDto) {
    return this.tenantsService.listTenants(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create tenant' })
  @ApiCreatedResponse({
    description: 'Created tenant record',
    type: TenantResponseDto,
    schema: {
      example: {
        id: 'tenant_456',
        name: 'Nova LLC',
        email: 'founder@nova.com',
        status: 'ACTIVE',
        createdAt: '2025-05-10T08:00:00.000Z',
        updatedAt: '2025-05-10T08:00:00.000Z',
        lastActiveAt: null,
      },
    },
  })
  createTenant(@Body() dto: CreateTenantDto) {
    return this.tenantsService.createTenant(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant details' })
  @ApiOkResponse({ type: TenantResponseDto })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  getTenant(@Param('id') id: string) {
    return this.tenantsService.getTenant(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant details' })
  @ApiOkResponse({ type: TenantResponseDto })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.updateTenant(id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate tenant' })
  @ApiOkResponse({ type: TenantResponseDto })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  activateTenant(@Param('id') id: string) {
    return this.tenantsService.activateTenant(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate tenant' })
  @ApiOkResponse({ type: TenantResponseDto })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  deactivateTenant(@Param('id') id: string) {
    return this.tenantsService.deactivateTenant(id);
  }

  @Patch(':id/subscription')
  @ApiOperation({ summary: 'Update tenant subscription fields' })
  @ApiOkResponse({ type: TenantResponseDto })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  updateSubscription(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.tenantsService.updateSubscription(id, dto);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get tenant usage stats' })
  @ApiOkResponse({
    description: 'Tenant stats payload',
    type: TenantStatsDto,
    schema: {
      example: {
        tenantId: 'tenant_123',
        tenantName: 'Acme Corp',
        status: 'ACTIVE',
        lastActiveAt: '2025-05-01T12:34:56.000Z',
        metricsLogged: 120,
        outcomesCompleted: 18,
        activitiesLogged: 45,
        salesLogged: 9,
        momentumScore: 78,
        streak: 6,
      },
    },
  })
  getTenantStats(@Param('id') id: string) {
    return this.tenantsService.getTenantStats(id);
  }
}
