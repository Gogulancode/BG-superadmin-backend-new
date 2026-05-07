import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupportRepository } from './support.repository';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { SupportQueryDto } from './dto/support-query.dto';
import { UpdateSupportStatusDto } from './dto/update-support-status.dto';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, SupportStatus } from '@prisma/client';

const STATUS_ORDER: SupportStatus[] = [SupportStatus.OPEN, SupportStatus.IN_PROGRESS, SupportStatus.RESOLVED];

@Injectable()
export class SupportService {
  constructor(
    private supportRepository: SupportRepository,
    private auditService: AuditService,
  ) {}

  listTickets(filters: SupportQueryDto) {
    return this.supportRepository.findAll(filters);
  }

  async getTicket(id: string) {
    const ticket = await this.supportRepository.findById(id);
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    return ticket;
  }

  async createTicket(dto: CreateSupportTicketDto) {
    const ticket = await this.supportRepository.create(dto);
    await this.auditService.logEvent({
      eventType: AuditEventType.SUPPORT_TICKET_CREATED,
      actor: 'SUPER_ADMIN',
      tenantId: dto.tenantId,
      metadata: {
        ticketId: ticket.id,
        subject: ticket.subject,
      },
    });
    return ticket;
  }

  async updateStatus(id: string, dto: UpdateSupportStatusDto) {
    const ticket = await this.getTicket(id);
    this.ensureValidTransition(ticket.status, dto.status);
    const updated = await this.supportRepository.updateStatus(id, dto.status);
    await this.auditService.logEvent({
      eventType: AuditEventType.SUPPORT_TICKET_STATUS_CHANGED,
      actor: 'SUPER_ADMIN',
      tenantId: ticket.tenantId,
      metadata: {
        ticketId: ticket.id,
        from: ticket.status,
        to: dto.status,
      },
    });
    return updated;
  }

  async assignAgent(id: string, dto: AssignAgentDto) {
    const ticket = await this.getTicket(id);
    const updated = await this.supportRepository.assignAgent(id, dto.assignedTo);
    await this.auditService.logEvent({
      eventType: AuditEventType.SUPPORT_TICKET_STATUS_CHANGED,
      actor: 'SUPER_ADMIN',
      tenantId: ticket.tenantId,
      metadata: {
        ticketId: ticket.id,
        action: 'AGENT_ASSIGNED',
        assignedTo: dto.assignedTo,
      },
    });
    return updated;
  }

  private ensureValidTransition(current: SupportStatus, next: SupportStatus) {
    const currentIndex = STATUS_ORDER.indexOf(current);
    const nextIndex = STATUS_ORDER.indexOf(next);
    if (nextIndex === -1 || currentIndex === -1) {
      throw new BadRequestException('Invalid status transition');
    }
    if (nextIndex < currentIndex) {
      throw new BadRequestException('Cannot revert support ticket status');
    }
  }
}
