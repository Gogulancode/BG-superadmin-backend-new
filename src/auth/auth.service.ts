import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { AuditEventType, Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { SessionService } from './sessions/session.service';
import { MfaService } from './mfa/mfa.service';
import { randomUUID } from 'node:crypto';

type RefreshTokenPayload = {
  sub: string;
  email: string;
  role: Role;
  sessionId?: string;
  refreshTokenId?: string;
  type?: string;
};

export interface LoginContext {
  userAgent: string;
  ipAddress: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
    private sessionService: SessionService,
    private mfaService: MfaService,
  ) {}

  async login(loginDto: LoginDto, context: LoginContext) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.isActive || user.role !== Role.SUPER_ADMIN) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if MFA is enabled
    if (user.isMfaEnabled) {
      // Return a temporary token and requiresMfa flag
      const tempToken = await this.mfaService.createTempToken(user.id, user.email);
      return {
        requiresMfa: true,
        tempToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    }

    // No MFA - proceed with full login
    return this.completeLogin(user, context);
  }

  async completeMfaLogin(tempToken: string, code: string, context: LoginContext) {
    // Verify MFA and get user
    const user = await this.mfaService.verifyLoginMfa(tempToken, code);
    
    // Complete login with full tokens
    return this.completeLogin(user, context);
  }

  private async completeLogin(user: any, context: LoginContext) {
    const refreshTokenId = randomUUID();
    
    // Create session
    const session = await this.sessionService.createSession({
      userId: user.id,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      refreshTokenId,
    });

    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role,
      sessionId: session.id,
      refreshTokenId,
    };

    const response = {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign({ ...payload, type: 'refresh' }, { expiresIn: '7d' }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isMfaEnabled: user.isMfaEnabled,
      },
    };

    await this.auditService.logEvent({
      eventType: AuditEventType.SUPERADMIN_LOGIN,
      actor: `SUPER_ADMIN:${user.email}`,
      metadata: { userId: user.id, sessionId: session.id },
    });

    return response;
  }

  async refreshToken(refreshToken: string) {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh' || !payload.refreshTokenId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await this.sessionService.isRefreshTokenValid(payload.refreshTokenId);
    if (!isValid) {
      throw new UnauthorizedException('Session has been revoked');
    }
    await this.sessionService.touchSessionByRefreshToken(payload.refreshTokenId);

    const dbUser = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!dbUser || !dbUser.isActive || dbUser.role !== Role.SUPER_ADMIN) {
      throw new UnauthorizedException('Invalid user');
    }

    const accessPayload = { 
      email: dbUser.email, 
      sub: dbUser.id, 
      role: dbUser.role,
      sessionId: payload.sessionId,
      refreshTokenId: payload.refreshTokenId,
    };

    return {
      access_token: this.jwtService.sign(accessPayload),
    };
  }

  async logout(userId: string, refreshTokenId?: string) {
    await this.sessionService.revokeCurrentSession(userId, refreshTokenId);
    return { message: 'Logged out successfully' };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (
      user &&
      user.role === Role.SUPER_ADMIN &&
      (await bcrypt.compare(password, user.passwordHash))
    ) {
      const { passwordHash, mfaSecret, ...result } = user;
      return result;
    }
    return null;
  }
}
