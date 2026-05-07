import { ApiPropertyOptional } from '@nestjs/swagger';
import { SupportStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SupportQueryDto {
  @ApiPropertyOptional({ description: 'Filter by tenant ID' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: SupportStatus })
  @IsOptional()
  @IsEnum(SupportStatus)
  status?: SupportStatus;

  @ApiPropertyOptional({ description: 'Search subject or message for a substring' })
  @IsOptional()
  @IsString()
  search?: string;
}
