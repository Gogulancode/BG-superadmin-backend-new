import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const RATE_LIMIT_PER_HOUR = 1000;

@Injectable()
export class OpsService {
  constructor(private prisma: PrismaService) {}

  async getHealth() {
    const startedAt = Date.now();
    let databaseStatus: 'healthy' | 'unhealthy' = 'healthy';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      databaseStatus = 'unhealthy';
    }

    const latencyMs = Date.now() - startedAt;
    const memory = process.memoryUsage();

    return {
      status: databaseStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: {
        status: databaseStatus,
        latencyMs,
      },
      redis: {
        status: 'degraded',
        connected: false,
      },
      memory: {
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        rss: memory.rss,
      },
    };
  }

  async getEnvironment() {
    const memory = process.memoryUsage();
    const total = memory.heapTotal || 1;

    return {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: memory.heapUsed,
        total,
        percentage: Math.round((memory.heapUsed / total) * 100),
      },
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  async getRateLimits() {
    const windowStart = new Date(Date.now() - 60 * 60 * 1000);
    const tenants = await this.prisma.tenant.findMany({
      select: { id: true, name: true, status: true },
      orderBy: { name: 'asc' },
      take: 100,
    });

    const snapshots = await Promise.all(
      tenants.map(async (tenant) => {
        const requestCount = await this.prisma.auditLog.count({
          where: {
            tenantId: tenant.id,
            createdAt: { gte: windowStart },
          },
        });

        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          requestCount,
          limitReached: requestCount >= RATE_LIMIT_PER_HOUR,
          windowStart: windowStart.toISOString(),
        };
      }),
    );

    return { tenants: snapshots };
  }

  async getTelemetry() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [jobsProcessed, jobsFailed, lastAudit] = await Promise.all([
      this.prisma.auditLog.count({ where: { createdAt: { gte: oneDayAgo } } }),
      this.prisma.supportTicket.count({ where: { status: 'OPEN', priority: 'HIGH' } }),
      this.prisma.auditLog.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    ]);

    return {
      jobsProcessed,
      jobsFailed,
      avgProcessingTimeMs: 0,
      queueDepth: jobsFailed,
      lastRunAt: lastAudit?.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
