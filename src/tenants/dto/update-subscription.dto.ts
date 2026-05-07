import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionStatus } from '@prisma/client';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;

  @ApiPropertyOptional({ example: 'GROWTH' })
  @IsOptional()
  @IsString()
  planCode?: string | null;

  @ApiPropertyOptional({ description: 'ISO date for next renewal' })
  @IsOptional()
  @IsDateString()
  renewalDate?: string | null;

  @ApiPropertyOptional({ description: 'ISO date for trial end' })
  @IsOptional()
  @IsDateString()
  trialEndsAt?: string | null;
}
