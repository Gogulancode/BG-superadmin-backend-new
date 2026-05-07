import { ApiProperty } from '@nestjs/swagger';
import { SupportStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateSupportStatusDto {
  @ApiProperty({ enum: SupportStatus, example: SupportStatus.IN_PROGRESS })
  @IsEnum(SupportStatus)
  status: SupportStatus;
}
