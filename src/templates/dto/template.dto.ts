import { ApiProperty } from '@nestjs/swagger';
import { TemplateType } from '@prisma/client';

export class TemplateDto {
  @ApiProperty({ example: 'template_123' })
  id: string;

  @ApiProperty({ enum: TemplateType, example: TemplateType.METRIC })
  type: TemplateType;

  @ApiProperty({ example: 'Weekly Revenue Metric' })
  name: string;

  @ApiProperty({ example: 'Tracks weekly revenue numbers', nullable: true })
  description?: string | null;

  @ApiProperty({ example: { fields: ['amount', 'notes'] } })
  payload: Record<string, any>;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2025-06-01T12:34:56.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-06-02T09:00:00.000Z' })
  updatedAt: Date;
}
