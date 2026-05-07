import { ApiProperty } from '@nestjs/swagger';
import { SupportPriority, SupportStatus } from '@prisma/client';

export class SupportTicketDto {
  @ApiProperty({ example: 'ticket_123' })
  id: string;

  @ApiProperty({ example: 'tenant_123' })
  tenantId: string;

  @ApiProperty({ example: 'API outage' })
  subject: string;

  @ApiProperty({ example: 'Users cannot submit forms' })
  message: string;

  @ApiProperty({ enum: SupportStatus, example: SupportStatus.OPEN })
  status: SupportStatus;

  @ApiProperty({ enum: SupportPriority, example: SupportPriority.MEDIUM })
  priority: SupportPriority;

  @ApiProperty({ example: '2025-06-01T12:34:56.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-06-01T13:00:00.000Z' })
  updatedAt: Date;
}
