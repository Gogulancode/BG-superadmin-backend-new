import { Test } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: {
    tenant: { findUnique: jest.Mock };
    auditLog: { count: jest.Mock };
    supportTicket: { count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      tenant: {
        findUnique: jest.fn(),
      },
      auditLog: {
        count: jest.fn(),
      },
      supportTicket: {
        count: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(ReportsService);
  });

  it('returns combined tenant and usage summary', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant_1',
      name: 'Acme',
      email: 'team@acme.com',
      status: 'ACTIVE',
      subscriptionStatus: 'ACTIVE',
      planCode: 'GROWTH',
      renewalDate: new Date('2025-07-01T00:00:00.000Z'),
      trialEndsAt: null,
      lastActiveAt: new Date('2025-06-01T00:00:00.000Z'),
      usageSummary: { metricsLogged: 10 },
    });
    prisma.auditLog.count.mockResolvedValue(3);
    prisma.supportTicket.count.mockResolvedValue(2);

    const result = await service.tenantSummary('tenant_1');
    expect(result.tenant.id).toBe('tenant_1');
    expect(result.usage.metricsLogged).toBe(10);
    expect(result.usage.streak).toBe(0);
    expect(result.activity.auditEvents).toBe(3);
    expect(result.activity.supportTickets).toBe(2);
  });

  it('throws if tenant missing', async () => {
    prisma.tenant.findUnique.mockResolvedValue(null);
    await expect(service.tenantSummary('missing')).rejects.toThrow('Tenant not found');
  });
});
