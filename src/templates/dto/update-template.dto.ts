import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

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

  @ApiPropertyOptional({ description: 'Toggle template availability' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
