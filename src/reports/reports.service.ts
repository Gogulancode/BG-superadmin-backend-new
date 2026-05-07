import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { TenantStatus, SubscriptionStatus } from '@prisma/client';

const USAGE_DEFAULTS = {
  metricsLogged: 0,
  outcomesCompleted: 0,
  activitiesLogged: 0,
  salesLogged: 0,
  momentumScore: 0,
  streak: 0,
};

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async tenantSummary(id: string, query?: ReportQueryDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        subscriptionStatus: true,
        planCode: true,
        renewalDate: true,
        trialEndsAt: true,
        lastActiveAt: true,
        usageSummary: true,
        isOnboarded: true,
        onboardedAt: true,
        createdAt: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Build audit log query for date range
    const auditWhere: any = { tenantId: id };
    if (query?.startDate || query?.endDate) {
      auditWhere.createdAt = {};
      if (query.startDate) {
        auditWhere.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        auditWhere.createdAt.lte = new Date(query.endDate);
      }
    }

    const [auditCount, supportCount] = await Promise.all([
      this.prisma.auditLog.count({ where: auditWhere }),
      this.prisma.supportTicket.count({ where: { tenantId: id } }),
    ]);

    const usageData = typeof tenant.usageSummary === 'object' && tenant.usageSummary !== null 
      ? tenant.usageSummary as Record<string, unknown>
      : {};

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        status: tenant.status,
        subscriptionStatus: tenant.subscriptionStatus,
        planCode: tenant.planCode,
        renewalDate: tenant.renewalDate,
        trialEndsAt: tenant.trialEndsAt,
        isOnboarded: tenant.isOnboarded,
        onboardedAt: tenant.onboardedAt,
        createdAt: tenant.createdAt,
      },
      usage: {
        ...USAGE_DEFAULTS,
        ...usageData,
        lastActiveAt: tenant.lastActiveAt,
      },
      activity: {
        auditEvents: auditCount,
        supportTickets: supportCount,
      },
      dateRange: {
        startDate: query?.startDate ?? null,
        endDate: query?.endDate ?? null,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async exportTenantCsv(id: string, query?: ReportQueryDto) {
    const report = await this.tenantSummary(id, query);
    
    const rows = [
      ['Tenant Report', ''],
      ['Generated At', report.generatedAt],
      [''],
      ['Tenant Details', ''],
      ['ID', report.tenant.id],
      ['Name', report.tenant.name],
      ['Email', report.tenant.email],
      ['Status', report.tenant.status],
      ['Subscription', report.tenant.subscriptionStatus],
      ['Plan', report.tenant.planCode ?? 'N/A'],
      ['Onboarded', report.tenant.isOnboarded ? 'Yes' : 'No'],
      [''],
      ['Usage Metrics', ''],
      ['Metrics Logged', report.usage.metricsLogged],
      ['Outcomes Completed', report.usage.outcomesCompleted],
      ['Activities Logged', report.usage.activitiesLogged],
      ['Sales Logged', report.usage.salesLogged],
      ['Momentum Score', report.usage.momentumScore],
      ['Streak', report.usage.streak],
      ['Last Active', report.usage.lastActiveAt ?? 'Never'],
      [''],
      ['Activity', ''],
      ['Audit Events', report.activity.auditEvents],
      ['Support Tickets', report.activity.supportTickets],
    ];

    return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  async platformSummary(query?: ReportQueryDto) {
    const dateWhere: any = {};
    if (query?.startDate || query?.endDate) {
      dateWhere.createdAt = {};
      if (query.startDate) {
        dateWhere.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        dateWhere.createdAt.lte = new Date(query.endDate);
      }
    }

    const [
      totalTenants,
      activeTenants,
      trialTenants,
      paidTenants,
      onboardedTenants,
      recentTenants,
      planDistribution,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      this.prisma.tenant.count({ where: { subscriptionStatus: SubscriptionStatus.TRIAL } }),
      this.prisma.tenant.count({ where: { subscriptionStatus: SubscriptionStatus.ACTIVE } }),
      this.prisma.tenant.count({ where: { isOnboarded: true } }),
      this.prisma.tenant.findMany({
        where: dateWhere,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, createdAt: true, status: true },
      }),
      this.prisma.tenant.groupBy({
        by: ['planCode'],
        _count: { planCode: true },
      }),
    ]);

    // Build tenant growth chart (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const tenantsByDay = await this.prisma.tenant.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
    });

    const tenantGrowth = this.buildDailyChart(thirtyDaysAgo, tenantsByDay);

    return {
      kpis: {
        totalTenants,
        activeTenants,
        trialTenants,
        paidTenants,
        onboardedTenants,
        onboardingRate: totalTenants > 0 ? Math.round((onboardedTenants / totalTenants) * 100) : 0,
      },
      charts: {
        tenantGrowth,
        revenueByPlan: planDistribution.map(p => ({
          plan: p.planCode ?? 'No Plan',
          count: p._count.planCode,
        })),
      },
      recentTenants,
      dateRange: {
        startDate: query?.startDate ?? null,
        endDate: query?.endDate ?? null,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async exportPlatformCsv(query?: ReportQueryDto) {
    const report = await this.platformSummary(query);
    
    const rows = [
      ['Platform Report', ''],
      ['Generated At', report.generatedAt],
      [''],
      ['KPIs', ''],
      ['Total Tenants', report.kpis.totalTenants],
      ['Active Tenants', report.kpis.activeTenants],
      ['Trial Tenants', report.kpis.trialTenants],
      ['Paid Tenants', report.kpis.paidTenants],
      ['Onboarded Tenants', report.kpis.onboardedTenants],
      ['Onboarding Rate', `${report.kpis.onboardingRate}%`],
      [''],
      ['Plan Distribution', ''],
      ...report.charts.revenueByPlan.map(p => [p.plan, p.count]),
      [''],
      ['Recent Tenants', ''],
      ['Name', 'Status', 'Created At'],
      ...report.recentTenants.map(t => [t.name, t.status, t.createdAt]),
    ];

    return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  private buildDailyChart(startDate: Date, data: any[]): { date: string; count: number }[] {
    const days = 30;
    const result: { date: string; count: number }[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      const count = data.filter(d => 
        d.createdAt && d.createdAt.toISOString().startsWith(dateKey)
      ).reduce((sum, d) => sum + (d._count?.id ?? 0), 0);
      
      result.push({ date: dateKey, count });
    }
    
    return result;
  }
}
