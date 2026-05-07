import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSessionDto } from './dto/session.dto';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new session on login
   */
  async createSession(dto: CreateSessionDto) {
    return this.prisma.superadminSession.create({
      data: {
        userId: dto.userId,
        userAgent: dto.userAgent,
        ipAddress: dto.ipAddress,
        refreshTokenId: dto.refreshTokenId,
      },
    });
  }

  /**
   * Get all active sessions for a user
   */
  async getSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.prisma.superadminSession.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      orderBy: { lastSeenAt: 'desc' },
    });

    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        lastSeenAt: s.lastSeenAt,
        revokedAt: s.revokedAt,
        isCurrent: s.id === currentSessionId,
      })),
      total: sessions.length,
    };
  }

  /**
   * Update lastSeenAt for a session
   */
  async touchSession(sessionId: string) {
    return this.prisma.superadminSession.update({
      where: { id: sessionId },
      data: { lastSeenAt: new Date() },
    });
  }

  /**
   * Update session by refresh token ID
   */
  async touchSessionByRefreshToken(refreshTokenId: string) {
    const session = await this.prisma.superadminSession.findUnique({
      where: { refreshTokenId },
    });

    if (session && !session.revokedAt) {
      return this.prisma.superadminSession.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      });
    }
    return null;
  }

  /**
   * Check if a session is valid (not revoked)
   */
  async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.prisma.superadminSession.findUnique({
      where: { id: sessionId },
    });
    return session !== null && session.revokedAt === null;
  }

  /**
   * Check if refresh token is valid (session not revoked)
   */
  async isRefreshTokenValid(refreshTokenId: string): Promise<boolean> {
    const session = await this.prisma.superadminSession.findUnique({
      where: { refreshTokenId },
    });
    return session !== null && session.revokedAt === null;
  }

  /**
   * Revoke a single session
   */
  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.superadminSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Cannot revoke another user\'s session');
    }

    if (session.revokedAt) {
      return { message: 'Session already revoked' };
    }

    await this.prisma.superadminSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Session revoked successfully' };
  }

  /**
   * Revoke all sessions for a user, optionally keeping the current one
   */
  async revokeAllSessions(userId: string, currentSessionId?: string, keepCurrent = true) {
    const whereClause: any = {
      userId,
      revokedAt: null,
    };

    if (keepCurrent && currentSessionId) {
      whereClause.id = { not: currentSessionId };
    }

    const result = await this.prisma.superadminSession.updateMany({
      where: whereClause,
      data: { revokedAt: new Date() },
    });

    return {
      message: `Revoked ${result.count} session(s)`,
      count: result.count,
    };
  }

  /**
   * Revoke session by user ID (for logout)
   */
  async revokeCurrentSession(userId: string, refreshTokenId?: string) {
    if (refreshTokenId) {
      const session = await this.prisma.superadminSession.findUnique({
        where: { refreshTokenId },
      });

      if (session && session.userId === userId) {
        await this.prisma.superadminSession.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        });
        return { message: 'Session revoked successfully' };
      }
    }

    // If no refresh token, revoke the most recent session
    const latestSession = await this.prisma.superadminSession.findFirst({
      where: {
        userId,
        revokedAt: null,
      },
      orderBy: { lastSeenAt: 'desc' },
    });

    if (latestSession) {
      await this.prisma.superadminSession.update({
        where: { id: latestSession.id },
        data: { revokedAt: new Date() },
      });
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Get session by refresh token ID
   */
  async getSessionByRefreshToken(refreshTokenId: string) {
    return this.prisma.superadminSession.findUnique({
      where: { refreshTokenId },
    });
  }

  /**
   * Clean up old revoked sessions (could be run as a cron job)
   */
  async cleanupOldSessions(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.prisma.superadminSession.deleteMany({
      where: {
        OR: [
          { revokedAt: { lt: cutoffDate } },
          { lastSeenAt: { lt: cutoffDate }, revokedAt: null },
        ],
      },
    });
  }
}
