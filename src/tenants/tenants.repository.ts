import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus, TenantStatus } from '@prisma/client';
import { TenantQueryDto } from './dto/tenant-query.dto';

@Injectable()
export class TenantsRepository {
  constructor(private prisma: PrismaService) {}

  async createTenant(data: {
    name: string;
    email: string;
    planCode?: string;
    subscriptionStatus?: SubscriptionStatus;
  }) {
    const subscriptionStatus = data.subscriptionStatus ?? SubscriptionStatus.TRIAL;
    const trialEndsAt = subscriptionStatus === SubscriptionStatus.TRIAL
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      : undefined;

    return this.prisma.tenant.create({
      data: {
        name: data.name,
        email: data.email,
        planCode: data.planCode,
        subscriptionStatus,
        trialEndsAt,
      },
    });
  }

  async findAll(query?: TenantQueryDto) {
    const where: any = {};

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.subscriptionStatus) {
      where.subscriptionStatus = query.subscriptionStatus;
    }

    if (query?.planCode) {
      where.planCode = query.planCode;
    }

    if (query?.isOnboarded !== undefined) {
      where.isOnboarded = query.isOnboarded;
    }

    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.tenant.count({ where }),
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

  async findById(id: string) {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async updateTenant(id: string, data: { name?: string; email?: string }) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: TenantStatus) {
    return this.prisma.tenant.update({
      where: { id },
      data: { status, lastActiveAt: status === TenantStatus.ACTIVE ? new Date() : undefined },
    });
  }

  async updateSubscription(id: string, data: {
    subscriptionStatus?: SubscriptionStatus;
    planCode?: string | null;
    renewalDate?: Date | null;
    trialEndsAt?: Date | null;
  }) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async recordUsageSnapshot(id: string, usage: any) {
    return this.prisma.tenant.update({
      where: { id },
      data: {
        lastActiveAt: new Date(),
        usageSummary: usage,
      },
    });
  }

  async getUsageStats(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        usageSummary: true,
        lastActiveAt: true,
      },
    });
  }

  async getDashboardSummary() {
    const [total, active, inactive] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.INACTIVE } }),
    ]);

    return { total, active, inactive };
  }

  async findCreatedSince(date: Date) {
    return this.prisma.tenant.findMany({
      where: { createdAt: { gte: date } },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findActivitySince(date: Date) {
    return this.prisma.tenant.findMany({
      where: { lastActiveAt: { gte: date } },
      select: { id: true, lastActiveAt: true },
      orderBy: { lastActiveAt: 'asc' },
    });
  }
}
