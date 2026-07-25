import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ description: 'Company or freelancer name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'Primary contact email' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Initial subscription plan code', example: 'STARTER' })
  @IsOptional()
  @IsString()
  planCode?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus, description: 'Initial subscription status' })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;
}
