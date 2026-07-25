import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: 'Template display name' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Template payload', example: { fields: ['amount'] } })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Template status supplied by the web UI', example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Template scope supplied by the web UI', example: 'GLOBAL' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: 'Template category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Template cadence' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ description: 'Template target value' })
  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @ApiPropertyOptional({ description: 'Metric schema fields configured from Superadmin' })
  @IsOptional()
  @IsArray()
  metricSchema?: Record<string, any>[];

  @ApiPropertyOptional({ description: 'Toggle template availability' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
