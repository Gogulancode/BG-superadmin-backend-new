import { Test } from '@nestjs/testing';
import { OpsService } from './ops.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OpsService', () => {
  let service: OpsService;
  let prisma: {
    $queryRaw: jest.Mock;
    tenant: { findMany: jest.Mock };
    auditLog: { count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]),
      tenant: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'tenant-1', name: 'Acme', status: 'ACTIVE' },
          { id: 'tenant-2', name: 'Nova', status: 'INACTIVE' },
        ]),
      },
      auditLog: {
        count: jest.fn().mockResolvedValue(12),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OpsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(OpsService);
  });

  it('reports database-backed health in the shape consumed by the ops page', async () => {
    const result = await service.getHealth();

    expect(result.status).toBe('healthy');
    expect(result.database.status).toBe('healthy');
    expect(result.database.latencyMs).toEqual(expect.any(Number));
    expect(result.memory.heapUsed).toEqual(expect.any(Number));
    expect(result.memory.heapTotal).toEqual(expect.any(Number));
    expect(result.memory.rss).toEqual(expect.any(Number));
    expect(result.uptime).toEqual(expect.any(Number));
    expect(result.timestamp).toEqual(expect.any(String));
  });

  it('returns per-tenant rate-limit snapshots from recent audit activity', async () => {
    const result = await service.getRateLimits();

    expect(result.tenants).toEqual([
      {
        tenantId: 'tenant-1',
        tenantName: 'Acme',
        requestCount: 12,
        limitReached: false,
        windowStart: expect.any(String),
      },
      {
        tenantId: 'tenant-2',
        tenantName: 'Nova',
        requestCount: 12,
        limitReached: false,
        windowStart: expect.any(String),
      },
    ]);
    expect(prisma.auditLog.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        createdAt: { gte: expect.any(Date) },
      },
    });
  });
});
