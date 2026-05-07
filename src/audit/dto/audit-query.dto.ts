import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditEventType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditQueryDto {
  @ApiPropertyOptional({ description: 'Search by actor, tenant name, or tenant email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by tenant ID' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Filter by actor or user identifier' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by event type', enum: AuditEventType })
  @IsOptional()
  @IsEnum(AuditEventType)
  eventType?: AuditEventType;

  @ApiPropertyOptional({ description: 'Filter events created after this ISO date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter events created before this ISO date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 50 })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 50;
}
