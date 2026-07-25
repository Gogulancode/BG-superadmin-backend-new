import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupportStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateSupportStatusDto {
  @ApiProperty({ enum: SupportStatus, example: SupportStatus.IN_PROGRESS })
  @IsEnum(SupportStatus)
  status: SupportStatus;

  @ApiPropertyOptional({ description: 'Optional assignee update' })
  @IsOptional()
  @IsString()
  assignee?: string;

  @ApiPropertyOptional({ description: 'Operational note captured in audit metadata' })
  @IsOptional()
  @IsString()
  note?: string;
}
