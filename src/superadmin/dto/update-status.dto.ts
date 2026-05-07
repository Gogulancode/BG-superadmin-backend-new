import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TenantStatus } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({ enum: TenantStatus })
  @IsEnum(TenantStatus)
  status: TenantStatus;
}
