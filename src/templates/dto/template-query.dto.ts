import { ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class TemplateQueryDto {
  @ApiPropertyOptional({ enum: TemplateType })
  @IsOptional()
  @IsEnum(TemplateType)
  type?: TemplateType;

  @ApiPropertyOptional({ description: 'Filter by active status', example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'boolean' || value === undefined || value === null) {
      return value;
    }
    return value === 'true' || value === true;
  })
  isActive?: boolean;
}
