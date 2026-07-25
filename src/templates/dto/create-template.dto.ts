import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateType } from '@prisma/client';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTemplateDto {
  @ApiPropertyOptional({ enum: TemplateType, example: TemplateType.METRIC })
  @IsOptional()
  @IsEnum(TemplateType)
  type?: TemplateType;

  @ApiProperty({ description: 'Template display name', example: 'Weekly Revenue Metric' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({ description: 'Optional description', example: 'Tracks revenue submitted every week' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Template scope supplied by the web UI', example: 'GLOBAL' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: 'Template status supplied by the web UI', example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Template category', example: 'Revenue' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Template cadence', example: 'WEEKLY' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ description: 'Template target value', example: 100000 })
  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @ApiPropertyOptional({ description: 'Metric schema fields configured from Superadmin' })
  @IsOptional()
  @IsArray()
  metricSchema?: Record<string, any>[];

  @ApiPropertyOptional({ description: 'JSON payload describing template structure', example: { fields: ['amount', 'notes'] } })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Whether template is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
