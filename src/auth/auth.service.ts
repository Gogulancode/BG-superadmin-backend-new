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

  async refreshToken(user: { userId: string; email: string; role: Role; sessionId?: string; refreshTokenId?: string }) {
    // Check if session is still valid
    if (user.refreshTokenId) {
      const isValid = await this.sessionService.isRefreshTokenValid(user.refreshTokenId);
      if (!isValid) {
        throw new UnauthorizedException('Session has been revoked');
      }
      // Update last seen
      await this.sessionService.touchSessionByRefreshToken(user.refreshTokenId);
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!dbUser || !dbUser.isActive || dbUser.role !== Role.SUPER_ADMIN) {
      throw new UnauthorizedException('Invalid user');
    }

    const payload = { 
      email: dbUser.email, 
      sub: dbUser.id, 
      role: dbUser.role,
      sessionId: user.sessionId,
      refreshTokenId: user.refreshTokenId,
    };

    return {
      access_token: this.jwtService.sign(payload),
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
