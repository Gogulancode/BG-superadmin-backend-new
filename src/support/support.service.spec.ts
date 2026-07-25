import { Test } from '@nestjs/testing';
import { SupportService } from './support.service';
import { SupportRepository } from './support.repository';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, SupportPriority, SupportStatus } from '@prisma/client';
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
      assignAgent: jest.fn(),
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

  const ticket = {
    id: 'ticket_1',
    tenantId: 'tenant_1',
    subject: 'Help',
    message: 'Broken',
    status: SupportStatus.OPEN,
    priority: SupportPriority.MEDIUM,
    assignedTo: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    tenant: { name: 'Tenant One' },
  };

  it('creates support tickets and logs events', async () => {
    repository.create.mockResolvedValue(ticket);

    const result = await service.createTicket({ tenantId: 'tenant_1', subject: 'Help', description: 'Broken', priority: undefined });

    expect(repository.create).toHaveBeenCalledWith({
      tenantId: 'tenant_1',
      subject: 'Help',
      message: 'Broken',
      priority: undefined,
    });
    expect(auditService.logEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.SUPPORT_TICKET_CREATED,
      actor: 'SUPER_ADMIN',
      tenantId: 'tenant_1',
      metadata: expect.objectContaining({ ticketId: 'ticket_1' }),
    });
    expect(result.id).toBe('ticket_1');
    expect(result.tenantName).toBe('Tenant One');
    expect(result.description).toBe('Broken');
  });

  it('returns paginated ticket lists in UI-friendly shape', async () => {
    repository.findAll.mockResolvedValue({
      data: [ticket],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });

    const result = await service.listTickets({ page: 1, pageSize: 20 });

    expect(result.total).toBe(1);
    expect(result.data[0]).toMatchObject({
      tenantName: 'Tenant One',
      description: 'Broken',
      assignee: undefined,
    });
  });

  it('prevents invalid status regressions', async () => {
    repository.findById.mockResolvedValue({ ...ticket, status: SupportStatus.RESOLVED });

    await expect(service.updateStatus('ticket_1', { status: SupportStatus.IN_PROGRESS })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when ticket missing', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.updateStatus('missing', { status: SupportStatus.OPEN })).rejects.toBeInstanceOf(NotFoundException);
  });
});
