import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus, TenantStatus } from '@prisma/client';

export class TenantReportUsageDto {
  @ApiProperty({ example: 120 })
  metricsLogged: number;

  @ApiProperty({ example: 15 })
  outcomesCompleted: number;

  @ApiProperty({ example: 42 })
  activitiesLogged: number;

  @ApiProperty({ example: 12 })
  salesLogged: number;

  @ApiProperty({ example: 78 })
  momentumScore: number;

  @ApiProperty({ example: 5 })
  streak: number;

  @ApiProperty({ example: '2025-06-02T00:00:00.000Z', nullable: true })
  lastActiveAt: string | null;
}

export class TenantReportTenantDto {
  @ApiProperty({ example: 'tenant_123' })
  id: string;

  @ApiProperty({ example: 'Acme Corp' })
  name: string;

  @ApiProperty({ example: 'owner@acme.com' })
  email: string;

  @ApiProperty({ enum: TenantStatus, example: TenantStatus.ACTIVE })
  status: TenantStatus;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE })
  subscriptionStatus: SubscriptionStatus;

  @ApiProperty({ example: 'GROWTH', nullable: true })
  planCode: string | null;

  @ApiProperty({ example: '2025-07-01T00:00:00.000Z', nullable: true })
  renewalDate: string | null;

  @ApiProperty({ example: '2025-06-15T00:00:00.000Z', nullable: true })
  trialEndsAt: string | null;
}

export class TenantReportDto {
  @ApiProperty({ type: TenantReportTenantDto })
  tenant: TenantReportTenantDto;

  @ApiProperty({ type: TenantReportUsageDto })
  usage: TenantReportUsageDto;
}
