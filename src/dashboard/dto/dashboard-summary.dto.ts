import { ApiProperty } from '@nestjs/swagger';

export class ActivityPointDto {
  @ApiProperty({ example: '2025-06-01' })
  date: string;

  @ApiProperty({ example: 12 })
  activeTenants: number;
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

  @ApiProperty({ type: [ActivityPointDto] })
  activityTrend: ActivityPointDto[];
}
