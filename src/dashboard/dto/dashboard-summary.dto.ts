import { ApiProperty } from '@nestjs/swagger';

export class ActivityPointDto {
  @ApiProperty({ example: '2025-06-01' })
  date: string;

  @ApiProperty({ example: 12 })
  activeTenants: number;
}

export class TenantGrowthPointDto {
  @ApiProperty({ example: 'Jan' })
  date: string;

  @ApiProperty({ example: 'Jan' })
  month: string;

  @ApiProperty({ example: 12 })
  count: number;
}

export class TopTenantActivityDto {
  @ApiProperty({ example: 'tenant_123' })
  tenantId: string;

  @ApiProperty({ example: 'Acme Corp' })
  tenantName: string;

  @ApiProperty({ example: 95 })
  activityScore: number;
}

export class DashboardSummaryDto {
  @ApiProperty({ example: 42 })
  totalTenants: number;

  @ApiProperty({ example: 30 })
  activeTenants: number;

  @ApiProperty({ example: 12 })
  inactiveTenants: number;

  @ApiProperty({ example: 5 })
  createdLast7Days: number;

  @ApiProperty({ example: 42 })
  totalUsers: number;

  @ApiProperty({ example: 120 })
  totalMetrics: number;

  @ApiProperty({ example: 18 })
  totalOutcomes: number;

  @ApiProperty({ example: 3 })
  openSupportTickets: number;

  @ApiProperty({ type: [ActivityPointDto] })
  activityTrend: ActivityPointDto[];

  @ApiProperty({ type: [TenantGrowthPointDto] })
  tenantGrowthSeries: TenantGrowthPointDto[];

  @ApiProperty({ type: [TopTenantActivityDto] })
  topTenantsByActivity: TopTenantActivityDto[];
}
