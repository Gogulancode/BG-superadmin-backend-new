import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Cache } from 'cache-manager';
import { authenticator } from 'otplib';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MfaService {
  private readonly cacheTtlMs = 10 * 60 * 1000; // 10 minutes
  private readonly tempTokenTtlMs = 5 * 60 * 1000; // 5 minutes for MFA login

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /**
   * Generate a new MFA secret for enrollment
   */
  async createEnrollment(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, isMfaEnabled: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isMfaEnabled) {
      throw new BadRequestException('MFA is already enabled. Disable it first to re-enroll.');
    }

    const secret = authenticator.generateSecret();
    await this.cache.set(this.enrollmentCacheKey(userId), secret, this.cacheTtlMs);

    const label = encodeURIComponent(
      user.name ? `${user.name} (${user.email})` : user.email,
    );
    const otpauthUrl = authenticator.keyuri(
      user.email,
      'Superadmin Platform',
      secret,
    );

    return { secret, otpauthUrl, label };
  }

  /**
   * Verify TOTP code and enable MFA for the user
   */
  async verifyAndEnable(userId: string, code: string) {
    const pendingSecret = await this.cache.get<string>(this.enrollmentCacheKey(userId));
    if (!pendingSecret) {
      throw new BadRequestException(
        'No pending MFA enrollment. Please call /auth/mfa/enroll first.',
      );
    }

    this.validateToken(pendingSecret, code);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isMfaEnabled: true,
        mfaSecret: pendingSecret,
        lastMfaVerifiedAt: new Date(),
      },
    });

    await this.cache.del(this.enrollmentCacheKey(userId));

    return { message: 'MFA enabled successfully' };
  }

  /**
   * Disable MFA (requires password + TOTP verification)
   */
  async disable(userId: string, code: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isMfaEnabled: true, mfaSecret: true, passwordHash: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isMfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA is not currently enabled');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Verify TOTP code
    this.validateToken(user.mfaSecret, code);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isMfaEnabled: false,
        mfaSecret: null,
        lastMfaVerifiedAt: null,
      },
    });

    return { message: 'MFA disabled successfully' };
  }

  /**
   * Get MFA status for user
   */
  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isMfaEnabled: true, lastMfaVerifiedAt: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      isMfaEnabled: user.isMfaEnabled,
      lastMfaVerifiedAt: user.lastMfaVerifiedAt,
    };
  }

  /**
   * Create a temporary token for MFA login flow
   */
  async createTempToken(userId: string, email: string): Promise<string> {
    const tempToken = this.jwtService.sign(
      { sub: userId, email, type: 'mfa_pending' },
      { expiresIn: '5m' },
    );

    // Store in cache to track validity
    await this.cache.set(this.tempTokenCacheKey(userId), tempToken, this.tempTokenTtlMs);

    return tempToken;
  }

  /**
   * Verify MFA code during login and issue full tokens
   */
  async verifyLoginMfa(tempToken: string, code: string) {
    // Decode and verify temp token
    let payload: { sub: string; email: string; type: string };
    try {
      payload = this.jwtService.verify(tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired temporary token');
    }

    if (payload.type !== 'mfa_pending') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Check if temp token is still valid in cache
    const cachedToken = await this.cache.get<string>(this.tempTokenCacheKey(payload.sub));
    if (cachedToken !== tempToken) {
      throw new UnauthorizedException('Temporary token has been invalidated');
    }

    // Get user and verify MFA
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, mfaSecret: true, isMfaEnabled: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    if (!user.isMfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA is not enabled for this user');
    }

    // Verify TOTP code
    this.validateToken(user.mfaSecret, code);

    // Update last MFA verified timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastMfaVerifiedAt: new Date() },
    });

    // Invalidate temp token
    await this.cache.del(this.tempTokenCacheKey(payload.sub));

    return user;
  }

  /**
   * Check if user has MFA enabled
   */
  async isMfaEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isMfaEnabled: true },
    });
    return user?.isMfaEnabled ?? false;
  }

  private validateToken(secret: string, token: string): void {
    if (!secret) {
      throw new BadRequestException('MFA secret missing');
    }
    const isValid = authenticator.verify({ token, secret });
    if (!isValid) {
      throw new BadRequestException('Invalid MFA code');
    }
  }

  private enrollmentCacheKey(userId: string): string {
    return `mfa:enrollment:${userId}`;
  }

  private tempTokenCacheKey(userId: string): string {
    return `mfa:temp:${userId}`;
  }
}
