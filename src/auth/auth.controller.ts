import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Request, Headers, Ip } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MfaLoginDto } from './mfa/dto/mfa.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'SuperAdmin login' })
  @ApiOkResponse({
    description: 'Successful login payload or MFA required',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            refresh_token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                isMfaEnabled: { type: 'boolean' },
              },
            },
          },
        },
        {
          type: 'object',
          properties: {
            requiresMfa: { type: 'boolean', example: true },
            tempToken: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Headers('user-agent') userAgent: string = 'Unknown',
    @Ip() ipAddress: string = 'Unknown',
  ) {
    return this.authService.login(loginDto, { userAgent, ipAddress });
  }

  @ApiOperation({ summary: 'Complete MFA login' })
  @ApiOkResponse({
    description: 'Full access and refresh tokens after MFA verification',
    schema: {
      example: {
        access_token: 'jwt.token.here',
        refresh_token: 'refresh.token.here',
        user: {
          id: 'user_123',
          email: 'admin@superadmin.com',
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
          isMfaEnabled: true,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid temp token or MFA code' })
  @Post('mfa/login')
  @HttpCode(HttpStatus.OK)
  async mfaLogin(
    @Body() dto: MfaLoginDto,
    @Headers('user-agent') userAgent: string = 'Unknown',
    @Ip() ipAddress: string = 'Unknown',
  ) {
    return this.authService.completeMfaLogin(dto.tempToken, dto.code, { userAgent, ipAddress });
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({
    description: 'New access token',
    schema: {
      example: {
        access_token: 'new.jwt.token.here',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token, or session revoked' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @ApiOperation({ summary: 'Logout and revoke current session' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ description: 'Logged out successfully' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    return this.authService.logout(req.user.userId, req.user.refreshTokenId);
  }
}
