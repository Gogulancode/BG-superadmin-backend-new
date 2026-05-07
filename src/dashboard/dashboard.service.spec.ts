import { Test } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { TenantsRepository } from '../tenants/tenants.repository';
import { PrismaService } from '../prisma/prisma.service';
import { SupportStatus } from '@prisma/client';

describe('DashboardService', () => {
  let service: DashboardService;
  let tenantsRepository: {
    getDashboardSummary: jest.Mock;
    findCreatedSince: jest.Mock;
    findActivitySince: jest.Mock;
  };
  let prisma: {
    tenant: { findMany: jest.Mock };
    supportTicket: { count: jest.Mock; findMany: jest.Mock };
    auditLog: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    tenantsRepository = {
      getDashboardSummary: jest.fn().mockResolvedValue({ total: 2, active: 1, inactive: 1 }),
      findCreatedSince: jest.fn().mockResolvedValue([{ id: 'tenant-1', createdAt: new Date() }]),
      findActivitySince: jest.fn().mockResolvedValue([
        { id: 'tenant-1', lastActiveAt: new Date('2026-05-07T10:00:00.000Z') },
      ]),
    };
    prisma = {
      tenant: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'tenant-1',
            name: 'Acme',
            createdAt: new Date('2026-01-10T00:00:00.000Z'),
            lastActiveAt: new Date('2026-05-07T10:00:00.000Z'),
            usageSummary: {
              metricsLogged: 10,
              outcomesCompleted: 4,
              activitiesLogged: 20,
              salesLogged: 6,
            },
          },
          {
            id: 'tenant-2',
            name: 'Nova',
            createdAt: new Date('2026-02-10T00:00:00.000Z'),
            lastActiveAt: null,
            usageSummary: {
              metricsLogged: 3,
              outcomesCompleted: 1,
              activitiesLogged: 2,
            },
          },
        ]),
      },
      supportTicket: {
        count: jest.fn().mockResolvedValue(3),
        findMany: jest.fn().mockResolvedValue([{ id: 'ticket-1', subject: 'Help' }]),
      },
      auditLog: {
        findMany: jest.fn().mockResolvedValue([{ id: 'audit-1', actor: 'SUPER_ADMIN' }]),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: TenantsRepository, useValue: tenantsRepository },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(DashboardService);
  });

  it('returns a complete production dashboard summary without mock-dependent fields', async () => {
    const result = await service.getSummary();

    expect(result).toMatchObject({
      totalTenants: 2,
      activeTenants: 1,
      inactiveTenants: 1,
      createdLast7Days: 1,
      totalUsers: 2,
      totalMetrics: 13,
      totalOutcomes: 5,
      openSupportTickets: 3,
    });
    expect(result.tenantGrowthSeries.length).toBe(6);
    expect(result.tenantGrowthSeries[0]).toEqual({
      date: expect.any(String),
      month: expect.any(String),
      count: expect.any(Number),
    });
    expect(result.topTenantsByActivity).toEqual([
      { tenantId: 'tenant-1', tenantName: 'Acme', activityScore: 36 },
      { tenantId: 'tenant-2', tenantName: 'Nova', activityScore: 5 },
    ]);
    expect(prisma.supportTicket.count).toHaveBeenCalledWith({
      where: { status: { in: [SupportStatus.OPEN, SupportStatus.IN_PROGRESS] } },
    });
  });

  it('returns recent support and audit lists for dashboard drill-downs', async () => {
    await expect(service.listSupportTickets()).resolves.toEqual([{ id: 'ticket-1', subject: 'Help' }]);
    await expect(service.listAuditLogs()).resolves.toEqual([{ id: 'audit-1', actor: 'SUPER_ADMIN' }]);
    expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
  });
});
