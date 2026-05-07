import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus, TenantStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class TenantQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: TenantStatus })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @ApiPropertyOptional({ description: 'Filter by subscription status', enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;

  @ApiPropertyOptional({ description: 'Filter by plan code' })
  @IsOptional()
  @IsString()
  planCode?: string;

  @ApiPropertyOptional({ description: 'Filter by onboarding status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isOnboarded?: boolean;

  @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 20;
}
