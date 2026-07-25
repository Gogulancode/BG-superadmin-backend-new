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
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.assignee) {
      where.assignedTo = filters.assignee;
    }
    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (!filters.page && !filters.pageSize) {
      return this.prisma.supportTicket.findMany({
        where,
        include: { tenant: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: { tenant: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string) {
    return this.prisma.supportTicket.findUnique({
      where: { id },
      include: { tenant: { select: { name: true } } },
    });
  }

  async updateStatus(id: string, status: SupportStatus, assignedTo?: string) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        status,
        assignedTo,
      },
      include: { tenant: { select: { name: true } } },
    });
  }

  async assignAgent(id: string, assignedTo: string) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: { assignedTo },
      include: { tenant: { select: { name: true } } },
    });
  }
}
