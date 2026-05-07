import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateType } from '@prisma/client';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({ enum: TemplateType, example: TemplateType.METRIC })
  @IsEnum(TemplateType)
  type: TemplateType;

  @ApiProperty({ description: 'Template display name', example: 'Weekly Revenue Metric' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({ description: 'Optional description', example: 'Tracks revenue submitted every week' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'JSON payload describing template structure', example: { fields: ['amount', 'notes'] } })
  @IsObject()
  payload: Record<string, any>;

  @ApiPropertyOptional({ description: 'Whether template is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
