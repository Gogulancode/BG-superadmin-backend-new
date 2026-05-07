import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupportQueryDto } from './dto/support-query.dto';
import { SupportPriority, SupportStatus } from '@prisma/client';

@Injectable()
export class SupportRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    tenantId: string;
    subject: string;
    message: string;
    priority?: SupportPriority;
  }) {
    return this.prisma.supportTicket.create({
      data: {
        tenantId: data.tenantId,
        subject: data.subject,
        message: data.message,
        priority: data.priority,
      },
    });
  }

  async findAll(filters: SupportQueryDto) {
    const where: any = {};
    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.supportTicket.findUnique({ where: { id } });
  }

  async updateStatus(id: string, status: SupportStatus) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status },
    });
  }

  async assignAgent(id: string, assignedTo: string) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: { assignedTo },
    });
  }
}
