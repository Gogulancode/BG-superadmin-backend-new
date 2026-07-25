import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupportPriority } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSupportTicketDto {
  @ApiProperty({ description: 'Tenant identifier', example: 'tenant_123' })
  @IsString()
  tenantId: string;

  @ApiProperty({ description: 'Ticket subject', example: 'Unable to access dashboard' })
  @IsString()
  @MinLength(3)
  subject: string;

  @ApiProperty({ description: 'Detailed message', example: 'Dashboard throws 500 when loading metrics' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  message?: string;

  @ApiPropertyOptional({ description: 'UI alias for detailed message' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  description?: string;

  @ApiPropertyOptional({ enum: SupportPriority, default: SupportPriority.MEDIUM })
  @IsOptional()
  @IsEnum(SupportPriority)
  priority?: SupportPriority;
}
