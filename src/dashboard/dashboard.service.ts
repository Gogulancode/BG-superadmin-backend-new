import { Injectable } from '@nestjs/common';
import { TenantsRepository } from '../tenants/tenants.repository';

@Injectable()
export class DashboardService {
  constructor(private tenantsRepository: TenantsRepository) {}

  async getSummary() {
    const { total, active, inactive } = await this.tenantsRepository.getDashboardSummary();

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - 6);

    const [createdSince, activitySince] = await Promise.all([
      this.tenantsRepository.findCreatedSince(windowStart),
      this.tenantsRepository.findActivitySince(windowStart),
    ]);

    const activityBuckets = activitySince.reduce<Record<string, number>>((acc, record) => {
      if (!record.lastActiveAt) {
        return acc;
      }
      const key = record.lastActiveAt.toISOString().split('T')[0];
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const activityTrend = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date(windowStart);
      date.setDate(windowStart.getDate() + idx);
      const key = date.toISOString().split('T')[0];
      return {
        date: key,
        activeTenants: activityBuckets[key] ?? 0,
      };
    });

    return {
      totalTenants: total,
      activeTenants: active,
      inactiveTenants: inactive,
      createdLast7Days: createdSince.length,
      activityTrend,
    };
  }

  async listSupportTickets() {
    return [];
  }

  async listAuditLogs() {
    return [];
  }
}
