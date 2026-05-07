import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { MfaService } from './mfa.service';
import {
  MfaCodeDto,
  MfaDisableDto,
  MfaLoginDto,
  MfaEnrollResponseDto,
  MfaStatusDto,
} from './dto/mfa.dto';

@ApiTags('Auth - MFA')
@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @ApiOperation({ summary: 'Get MFA status for current user' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: MfaStatusDto })
  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(@Request() req: any) {
    return this.mfaService.getStatus(req.user.userId);
  }

  @ApiOperation({ summary: 'Start MFA enrollment - generates secret and QR code URL' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    type: MfaEnrollResponseDto,
    description: 'Secret and OTPAuth URL for QR code',
  })
  @ApiBadRequestResponse({ description: 'MFA already enabled' })
  @UseGuards(JwtAuthGuard)
  @Post('enroll')
  @HttpCode(HttpStatus.OK)
  async enroll(@Request() req: any) {
    return this.mfaService.createEnrollment(req.user.userId);
  }

  @ApiOperation({ summary: 'Verify TOTP code and enable MFA' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ description: 'MFA enabled successfully' })
  @ApiBadRequestResponse({ description: 'Invalid code or no pending enrollment' })
  @UseGuards(JwtAuthGuard)
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Request() req: any, @Body() dto: MfaCodeDto) {
    return this.mfaService.verifyAndEnable(req.user.userId, dto.code);
  }

  @ApiOperation({ summary: 'Disable MFA (requires password and TOTP)' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ description: 'MFA disabled successfully' })
  @ApiBadRequestResponse({ description: 'Invalid code or MFA not enabled' })
  @ApiUnauthorizedResponse({ description: 'Invalid password' })
  @UseGuards(JwtAuthGuard)
  @Post('disable')
  @HttpCode(HttpStatus.OK)
  async disable(@Request() req: any, @Body() dto: MfaDisableDto) {
    return this.mfaService.disable(req.user.userId, dto.code, dto.password);
  }

  @ApiOperation({ summary: 'Complete MFA login with TOTP code' })
  @ApiOkResponse({
    description: 'Full access and refresh tokens',
    schema: {
      example: {
        access_token: 'jwt.token.here',
        refresh_token: 'refresh.token.here',
        user: {
          id: 'user_123',
          email: 'admin@superadmin.com',
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid temp token or MFA code' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async mfaLogin(@Body() dto: MfaLoginDto) {
    // This will be handled by AuthService after MFA verification
    // The controller just validates the DTO
    return this.mfaService.verifyLoginMfa(dto.tempToken, dto.code);
  }
}
