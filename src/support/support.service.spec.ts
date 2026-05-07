import { Test } from '@nestjs/testing';
import { SupportService } from './support.service';
import { SupportRepository } from './support.repository';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, SupportStatus } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SupportService', () => {
  let service: SupportService;
  let repository: jest.Mocked<SupportRepository>;
  let auditService: { logEvent: jest.Mock };

  beforeEach(async () => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
    } as any;
    auditService = { logEvent: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SupportService,
        { provide: SupportRepository, useValue: repository },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = moduleRef.get(SupportService);
  });

  it('creates support tickets and logs events', async () => {
    repository.create.mockResolvedValue({ id: 'ticket_1', tenantId: 'tenant_1', subject: 'Help', status: SupportStatus.OPEN });

    const result = await service.createTicket({ tenantId: 'tenant_1', subject: 'Help', message: 'Broken', priority: undefined });

    expect(repository.create).toHaveBeenCalled();
    expect(auditService.logEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.SUPPORT_TICKET_CREATED,
      actor: 'SUPER_ADMIN',
      tenantId: 'tenant_1',
      metadata: expect.objectContaining({ ticketId: 'ticket_1' }),
    });
    expect(result.id).toBe('ticket_1');
  });

  it('prevents invalid status regressions', async () => {
    repository.findById.mockResolvedValue({ id: 'ticket_1', status: SupportStatus.RESOLVED, tenantId: 'tenant_1' });

    await expect(
      service.updateStatus('ticket_1', { status: SupportStatus.IN_PROGRESS }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when ticket missing', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.updateStatus('missing', { status: SupportStatus.OPEN })).rejects.toBeInstanceOf(NotFoundException);
  });
});
