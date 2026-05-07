import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantStatus } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    tenant: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      tenant: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'tenant-1',
            name: 'Acme',
            email: 'owner@acme.test',
            status: TenantStatus.ACTIVE,
            lastActiveAt: new Date('2026-05-06T10:00:00.000Z'),
            createdAt: new Date('2026-05-01T10:00:00.000Z'),
          },
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('lists tenant admin users with pagination metadata', async () => {
    const result = await service.listUsers({ page: 1, pageSize: 10 });

    expect(result).toEqual({
      data: [
        {
          id: 'tenant-admin-tenant-1',
          email: 'owner@acme.test',
          name: 'Acme Admin',
          role: 'ADMIN',
          tenantId: 'tenant-1',
          tenantName: 'Acme',
          status: 'ACTIVE',
          lastLoginAt: new Date('2026-05-06T10:00:00.000Z'),
          createdAt: new Date('2026-05-01T10:00:00.000Z'),
        },
      ],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('maps inactive tenants to inactive tenant-admin users', async () => {
    prisma.tenant.findMany.mockResolvedValue([
      {
        id: 'tenant-2',
        name: 'Dormant',
        email: 'owner@dormant.test',
        status: TenantStatus.INACTIVE,
        lastActiveAt: null,
        createdAt: new Date('2026-04-01T10:00:00.000Z'),
      },
    ]);

    const result = await service.listUsers({ status: 'INACTIVE' });

    expect(result.data[0].status).toBe('INACTIVE');
    expect(prisma.tenant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: TenantStatus.INACTIVE }),
      }),
    );
  });
});
