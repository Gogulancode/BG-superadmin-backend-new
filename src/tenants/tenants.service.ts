import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantsRepository } from './tenants.repository';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantQueryDto } from './dto/tenant-query.dto';
import { AuditEventType, TenantStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class TenantsService {
  constructor(
    private tenantsRepository: TenantsRepository,
    private auditService: AuditService,
  ) {}

  async createTenant(dto: CreateTenantDto) {
    const tenant = await this.tenantsRepository.createTenant({
      name: dto.name,
      email: dto.email,
      planCode: dto.planCode,
      subscriptionStatus: dto.subscriptionStatus,
    });
    await this.auditService.logEvent({
      eventType: AuditEventType.TENANT_CREATED,
      actor: 'SUPER_ADMIN',
      tenantId: tenant.id,
      metadata: {
        name: tenant.name,
        email: tenant.email,
        planCode: tenant.planCode,
        subscriptionStatus: tenant.subscriptionStatus,
      },
    });
    return {
      ...tenant,
      provisioning: this.buildProvisioningDetails(tenant.email),
    };
  }

  async listTenants(query?: TenantQueryDto) {
    return this.tenantsRepository.findAll(query);
  }

  async getTenant(id: string) {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async updateTenant(id: string, dto: UpdateTenantDto) {
    const tenant = await this.getTenant(id);
    const updated = await this.tenantsRepository.updateTenant(id, dto);
    await this.auditService.logEvent({
      eventType: AuditEventType.TENANT_UPDATED,
      actor: 'SUPER_ADMIN',
      tenantId: tenant.id,
      metadata: {
        previous: { name: tenant.name, email: tenant.email },
        next: dto,
      },
    });
    return updated;
  }

  async activateTenant(id: string) {
    const tenant = await this.getTenant(id);
    const updated = await this.tenantsRepository.updateStatus(id, TenantStatus.ACTIVE);
    await this.auditService.logEvent({
      eventType: AuditEventType.TENANT_ACTIVATED,
      actor: 'SUPER_ADMIN',
      tenantId: tenant.id,
      metadata: { previousStatus: tenant.status },
    });
    return updated;
  }

  async deactivateTenant(id: string) {
    const tenant = await this.getTenant(id);
    const updated = await this.tenantsRepository.updateStatus(id, TenantStatus.INACTIVE);
    await this.auditService.logEvent({
      eventType: AuditEventType.TENANT_DEACTIVATED,
      actor: 'SUPER_ADMIN',
      tenantId: tenant.id,
      metadata: { previousStatus: tenant.status },
    });
    return updated;
  }

  async updateSubscription(id: string, dto: UpdateSubscriptionDto) {
    const tenant = await this.getTenant(id);
    const data: any = {};
    if (dto.subscriptionStatus) {
      data.subscriptionStatus = dto.subscriptionStatus;
    }
    if (dto.planCode !== undefined) {
      data.planCode = dto.planCode;
    }
    if (dto.renewalDate !== undefined) {
      data.renewalDate = dto.renewalDate ? new Date(dto.renewalDate) : null;
    }
    if (dto.trialEndsAt !== undefined) {
      data.trialEndsAt = dto.trialEndsAt ? new Date(dto.trialEndsAt) : null;
    }

    const updated = await this.tenantsRepository.updateSubscription(id, data);
    await this.auditService.logEvent({
      eventType: AuditEventType.TENANT_SUBSCRIPTION_UPDATED,
      actor: 'SUPER_ADMIN',
      tenantId: tenant.id,
      metadata: {
        previous: {
          subscriptionStatus: tenant.subscriptionStatus,
          planCode: tenant.planCode,
          renewalDate: tenant.renewalDate,
          trialEndsAt: tenant.trialEndsAt,
        },
        next: data,
      },
    });
    return updated;
  }

  async getTenantStats(id: string) {
    const stats = await this.tenantsRepository.getUsageStats(id);
    if (!stats) {
      throw new NotFoundException('Tenant not found');
    }

    const defaults = {
      metricsLogged: 0,
      outcomesCompleted: 0,
      activitiesLogged: 0,
      salesLogged: 0,
      momentumScore: 0,
      streak: 0,
    };

    const usageData = typeof stats.usageSummary === 'object' && stats.usageSummary !== null
      ? stats.usageSummary as Record<string, unknown>
      : {};

    return {
      tenantId: stats.id,
      tenantName: stats.name,
      status: stats.status,
      lastActiveAt: stats.lastActiveAt,
      ...defaults,
      ...usageData,
    };
  }

  private buildProvisioningDetails(email: string) {
    const baseUrl = (
      process.env.TENANT_APP_URL ??
      process.env.TENANT_WEB_URL ??
      process.env.FRONTEND_TENANT_URL ??
      'http://localhost:8080'
    ).replace(/\/$/, '');

    return {
      adminEmail: email,
      loginUrl: `${baseUrl}/login`,
      onboardingUrl: `${baseUrl}/register?email=${encodeURIComponent(email)}`,
      passwordDelivery: 'Tenant admin creates their own password through the tenant registration or reset flow. No temporary password is generated by Superadmin.',
    };
  }
}
