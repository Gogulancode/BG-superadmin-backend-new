import { Test } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEventType } from '@prisma/client';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: { auditLog: { create: jest.Mock; findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(AuditService);
  });

  it('creates audit events via logEvent', async () => {
    prisma.auditLog.create.mockResolvedValue({ id: 'audit_1' });

    const result = await service.logEvent({
      eventType: AuditEventType.SUPERADMIN_LOGIN,
      actor: 'SUPER_ADMIN:admin@example.com',
      metadata: { ip: '127.0.0.1' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        eventType: AuditEventType.SUPERADMIN_LOGIN,
        actor: 'SUPER_ADMIN:admin@example.com',
        metadata: { ip: '127.0.0.1' },
        tenantId: undefined,
      },
    });
    expect(result).toEqual({ id: 'audit_1' });
  });

  it('applies filters when listing events', async () => {
    prisma.auditLog.findMany.mockResolvedValue([]);

    await service.findAll({
      tenantId: 'tenant_123',
      eventType: AuditEventType.TENANT_CREATED,
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-31T23:59:59.000Z',
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant_123',
        eventType: AuditEventType.TENANT_CREATED,
        createdAt: {
          gte: new Date('2025-01-01T00:00:00.000Z'),
          lte: new Date('2025-01-31T23:59:59.000Z'),
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  });
});
