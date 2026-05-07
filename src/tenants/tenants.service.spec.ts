import { Test } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { TenantsRepository } from './tenants.repository';
import { TenantStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

describe('TenantsService.getTenantStats', () => {
  let service: TenantsService;
  let repository: jest.Mocked<TenantsRepository>;
  let auditService: { logEvent: jest.Mock };

  beforeEach(async () => {
    auditService = { logEvent: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: TenantsRepository,
          useValue: {
            getUsageStats: jest.fn(),
          },
        },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = moduleRef.get(TenantsService);
    repository = moduleRef.get(TenantsRepository) as jest.Mocked<TenantsRepository>;
  });

  it('returns fallback defaults when usageSummary is missing', async () => {
    const lastActiveAt = new Date('2025-05-05T00:00:00.000Z');
    repository.getUsageStats.mockResolvedValue({
      id: 'tenant-defaults',
      name: 'Defaults LLC',
      status: TenantStatus.ACTIVE,
      lastActiveAt,
      usageSummary: null,
    });

    const result = await service.getTenantStats('tenant-defaults');

    expect(result).toMatchObject({
      tenantId: 'tenant-defaults',
      tenantName: 'Defaults LLC',
      status: TenantStatus.ACTIVE,
      lastActiveAt,
      metricsLogged: 0,
      outcomesCompleted: 0,
      activitiesLogged: 0,
      salesLogged: 0,
      momentumScore: 0,
      streak: 0,
    });
  });

  it('overlays stored usageSummary values on top of defaults', async () => {
    repository.getUsageStats.mockResolvedValue({
      id: 'tenant-overlay',
      name: 'Overlay Inc',
      status: TenantStatus.ACTIVE,
      lastActiveAt: new Date('2025-06-01T12:00:00.000Z'),
      usageSummary: {
        streak: 7,
        momentumScore: 88,
        metricsLogged: 120,
        outcomesCompleted: 4,
        activitiesLogged: 25,
        salesLogged: 12,
      },
    });

    const result = await service.getTenantStats('tenant-overlay');

    expect(result).toMatchObject({
      streak: 7,
      momentumScore: 88,
      metricsLogged: 120,
      outcomesCompleted: 4,
      activitiesLogged: 25,
      salesLogged: 12,
    });
  });

  it('always includes metadata fields', async () => {
    const lastActiveAt = new Date('2025-07-04T09:30:00.000Z');
    repository.getUsageStats.mockResolvedValue({
      id: 'tenant-meta',
      name: 'Meta Co',
      status: TenantStatus.INACTIVE,
      lastActiveAt,
      usageSummary: { streak: 1 },
    });

    const result = await service.getTenantStats('tenant-meta');

    expect(result.tenantId).toBe('tenant-meta');
    expect(result.tenantName).toBe('Meta Co');
    expect(result.status).toBe(TenantStatus.INACTIVE);
    expect(result.lastActiveAt).toEqual(lastActiveAt);
  });
});
