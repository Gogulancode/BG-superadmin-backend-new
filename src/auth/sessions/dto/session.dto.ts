import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class SessionDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'User agent string from the client' })
  userAgent: string;

  @ApiProperty({ description: 'IP address of the client' })
  ipAddress: string;

  @ApiProperty({ description: 'When the session was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Last activity timestamp' })
  lastSeenAt: Date;

  @ApiPropertyOptional({ description: 'When the session was revoked (if applicable)' })
  revokedAt?: Date;

  @ApiProperty({ description: 'Whether this is the current session' })
  isCurrent: boolean;
}

export class SessionListResponseDto {
  @ApiProperty({ type: [SessionDto] })
  sessions: SessionDto[];

  @ApiProperty({ description: 'Total number of sessions' })
  total: number;
}

export class RevokeAllSessionsDto {
  @ApiPropertyOptional({ description: 'Keep the current session active', default: true })
  @IsOptional()
  @IsBoolean()
  keepCurrent?: boolean;
}

export class CreateSessionDto {
  userId: string;
  userAgent: string;
  ipAddress: string;
  refreshTokenId?: string;
}
