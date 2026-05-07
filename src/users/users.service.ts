import { Injectable } from '@nestjs/common';
import { Prisma, TenantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserQueryDto } from './dto/user-query.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async listUsers(query: UserQueryDto = {}) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    if (query.role && query.role !== 'ADMIN') {
      return this.emptyPage(page, pageSize);
    }

    const where = this.buildTenantWhere(query);
    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          lastActiveAt: true,
          createdAt: true,
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants.map((tenant) => this.toTenantAdminUser(tenant)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getStats() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalUsers, activeUsers, newThisWeek] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      this.prisma.tenant.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      adminUsers: totalUsers,
      newThisWeek,
    };
  }

  private buildTenantWhere(query: UserQueryDto): Prisma.TenantWhereInput {
    const where: Prisma.TenantWhereInput = {};

    if (query.tenantId) {
      where.id = query.tenantId;
    }

    if (query.status === 'ACTIVE') {
      where.status = TenantStatus.ACTIVE;
    }

    if (query.status === 'INACTIVE' || query.status === 'SUSPENDED') {
      where.status = TenantStatus.INACTIVE;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private toTenantAdminUser(tenant: {
    id: string;
    name: string;
    email: string;
    status: TenantStatus;
    lastActiveAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: `tenant-admin-${tenant.id}`,
      email: tenant.email,
      name: `${tenant.name} Admin`,
      role: 'ADMIN',
      tenantId: tenant.id,
      tenantName: tenant.name,
      status: tenant.status === TenantStatus.ACTIVE ? 'ACTIVE' : 'INACTIVE',
      lastLoginAt: tenant.lastActiveAt,
      createdAt: tenant.createdAt,
    };
  }

  private emptyPage(page: number, pageSize: number) {
    return {
      data: [],
      page,
      pageSize,
      total: 0,
      totalPages: 0,
    };
  }
}
