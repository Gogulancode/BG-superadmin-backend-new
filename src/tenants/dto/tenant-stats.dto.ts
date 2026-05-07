import { ApiProperty } from '@nestjs/swagger';
import { TenantStatus } from '@prisma/client';

export class TenantStatsDto {
  @ApiProperty({ example: 'tenant_123' })
  tenantId: string;

  @ApiProperty({ example: 'Acme Corp' })
  tenantName: string;

  @ApiProperty({ enum: TenantStatus, example: TenantStatus.ACTIVE })
  status: TenantStatus;

  @ApiProperty({ example: '2025-05-20T10:00:00.000Z', nullable: true })
  lastActiveAt: Date | null;

  @ApiProperty({ example: 120 })
  metricsLogged: number;

  @ApiProperty({ example: 18 })
  outcomesCompleted: number;

  @ApiProperty({ example: 45 })
  activitiesLogged: number;

  @ApiProperty({ example: 9 })
  salesLogged: number;

  @ApiProperty({ example: 78 })
  momentumScore: number;

  @ApiProperty({ example: 6 })
  streak: number;
}
