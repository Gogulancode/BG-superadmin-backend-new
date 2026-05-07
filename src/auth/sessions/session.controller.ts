import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SessionService } from './session.service';
import { RevokeAllSessionsDto, SessionListResponseDto } from './dto/session.dto';

@ApiTags('Auth - Sessions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('auth/sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @ApiOperation({ summary: 'List all active sessions for current user' })
  @ApiOkResponse({ type: SessionListResponseDto })
  @Get()
  async getSessions(@Request() req: any) {
    const currentSessionId = req.user.sessionId;
    return this.sessionService.getSessions(req.user.userId, currentSessionId);
  }

  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiOkResponse({ description: 'Session revoked successfully' })
  @ApiNotFoundResponse({ description: 'Session not found' })
  @ApiForbiddenResponse({ description: 'Cannot revoke another user\'s session' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async revokeSession(@Request() req: any, @Param('id') sessionId: string) {
    return this.sessionService.revokeSession(req.user.userId, sessionId);
  }

  @ApiOperation({ summary: 'Revoke all other sessions (optionally keep current)' })
  @ApiOkResponse({ description: 'Sessions revoked', schema: { example: { message: 'Revoked 3 session(s)', count: 3 } } })
  @Delete()
  @HttpCode(HttpStatus.OK)
  async revokeAllSessions(@Request() req: any, @Body() dto?: RevokeAllSessionsDto) {
    const keepCurrent = dto?.keepCurrent !== false;
    const currentSessionId = req.user.sessionId;
    return this.sessionService.revokeAllSessions(req.user.userId, currentSessionId, keepCurrent);
  }
}
