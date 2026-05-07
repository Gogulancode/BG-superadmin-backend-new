import { Injectable } from '@nestjs/common';
import { SupportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsRepository } from '../tenants/tenants.repository';

@Injectable()
export class DashboardService {
  constructor(
    private tenantsRepository: TenantsRepository,
    private prisma: PrismaService,
  ) {}

  async getSummary() {
    const { total, active, inactive } = await this.tenantsRepository.getDashboardSummary();

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - 6);

    const [createdSince, activitySince] = await Promise.all([
      this.tenantsRepository.findCreatedSince(windowStart),
      this.tenantsRepository.findActivitySince(windowStart),
    ]);
    const [tenantUsageRows, openSupportTickets] = await Promise.all([
      this.prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
          lastActiveAt: true,
          usageSummary: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.supportTicket.count({
        where: { status: { in: [SupportStatus.OPEN, SupportStatus.IN_PROGRESS] } },
      }),
    ]);

    const activityBuckets = activitySince.reduce<Record<string, number>>((acc, record) => {
      if (!record.lastActiveAt) {
        return acc;
      }
      const key = record.lastActiveAt.toISOString().split('T')[0];
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const activityTrend = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date(windowStart);
      date.setDate(windowStart.getDate() + idx);
      const key = date.toISOString().split('T')[0];
      return {
        date: key,
        activeTenants: activityBuckets[key] ?? 0,
      };
    });

    return {
      totalTenants: total,
      activeTenants: active,
      inactiveTenants: inactive,
      createdLast7Days: createdSince.length,
      totalUsers: total,
      totalMetrics: tenantUsageRows.reduce((sum, tenant) => sum + this.numberFromUsage(tenant.usageSummary, 'metricsLogged'), 0),
      totalOutcomes: tenantUsageRows.reduce((sum, tenant) => sum + this.numberFromUsage(tenant.usageSummary, 'outcomesCompleted'), 0),
      openSupportTickets,
      activityTrend,
      tenantGrowthSeries: this.buildTenantGrowthSeries(tenantUsageRows.map((tenant) => tenant.createdAt)),
      topTenantsByActivity: tenantUsageRows
        .map((tenant) => ({
          tenantId: tenant.id,
          tenantName: tenant.name,
          activityScore:
            this.numberFromUsage(tenant.usageSummary, 'metricsLogged') +
            this.numberFromUsage(tenant.usageSummary, 'activitiesLogged') +
            this.numberFromUsage(tenant.usageSummary, 'salesLogged'),
        }))
        .sort((a, b) => b.activityScore - a.activityScore)
        .slice(0, 5),
    };
  }

  async listSupportTickets() {
    return this.prisma.supportTicket.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        tenant: {
          select: { name: true, email: true },
        },
      },
    });
  }

  async listAuditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        tenant: {
          select: { name: true },
        },
      },
    });
  }

  private numberFromUsage(usageSummary: unknown, key: string) {
    if (!usageSummary || typeof usageSummary !== 'object' || Array.isArray(usageSummary)) {
      return 0;
    }

    const value = (usageSummary as Record<string, unknown>)[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private buildTenantGrowthSeries(createdDates: Date[]) {
    const now = new Date();

    return Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));
      const endOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      const label = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });

      return {
        date: label,
        month: label,
        count: createdDates.filter((createdAt) => createdAt <= endOfMonth).length,
      };
    });
  }
}
