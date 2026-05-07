import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isMfaEnabled: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Check if session is still valid (if sessionId is in token)
    if (payload.sessionId) {
      const session = await this.prisma.superadminSession.findUnique({
        where: { id: payload.sessionId },
      });
      
      if (!session || session.revokedAt) {
        throw new UnauthorizedException('Session has been revoked');
      }
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isMfaEnabled: user.isMfaEnabled,
      sessionId: payload.sessionId,
      refreshTokenId: payload.refreshTokenId,
    };
  }
}