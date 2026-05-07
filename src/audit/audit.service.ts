import { Injectable } from '@nestjs/common';
import { AuditEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditQueryDto } from './dto/audit-query.dto';

export interface LogEventInput {
  eventType: AuditEventType;
  actor: string;
  metadata?: Record<string, any>;
  tenantId?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logEvent(input: LogEventInput) {
    return this.prisma.auditLog.create({
      data: {
        eventType: input.eventType,
        actor: input.actor,
        metadata: input.metadata ?? Prisma.JsonNull,
        tenantId: input.tenantId,
      },
    });
  }

  async findAll(filters: AuditQueryDto) {
    const where = this.buildWhere(filters);

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 50;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          tenant: {
            select: { name: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async exportCsv(filters: AuditQueryDto) {
    const where = this.buildWhere(filters);

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: { name: true },
        },
      },
    });

    const headers = ['ID', 'Tenant ID', 'Tenant Name', 'Actor', 'Event Type', 'Metadata', 'Created At'];
    const rows = logs.map(log => [
      log.id,
      log.tenantId ?? '',
      log.tenant?.name ?? '',
      log.actor,
      log.eventType,
      JSON.stringify(log.metadata ?? {}),
      log.createdAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  private buildWhere(filters: AuditQueryDto) {
    const where: any = {};
    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }
    if (filters.userId) {
      where.actor = { contains: filters.userId, mode: 'insensitive' };
    }
    if (filters.eventType) {
      where.eventType = filters.eventType;
    }
    if (filters.search) {
      where.OR = [
        { actor: { contains: filters.search, mode: 'insensitive' } },
        { tenant: { name: { contains: filters.search, mode: 'insensitive' } } },
        { tenant: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    return where;
  }
}
