import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';

describe('AuthService.refreshToken', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };
  const jwtService = {
    verify: jest.fn(),
    sign: jest.fn(),
  };
  const auditService = {
    logEvent: jest.fn(),
  };
  const sessionService = {
    createSession: jest.fn(),
    isRefreshTokenValid: jest.fn(),
    rotateRefreshToken: jest.fn(),
    revokeCurrentSession: jest.fn(),
  };
  const mfaService = {};

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as any,
      jwtService as any,
      auditService as any,
      sessionService as any,
      mfaService as any,
    );
  });

  it('rotates refresh tokens and returns both access and refresh tokens', async () => {
    jwtService.verify.mockReturnValue({
      sub: 'user_1',
      email: 'admin@example.com',
      role: Role.SUPER_ADMIN,
      sessionId: 'session_1',
      refreshTokenId: 'refresh_old',
      type: 'refresh',
    });
    sessionService.isRefreshTokenValid.mockResolvedValue(true);
    sessionService.rotateRefreshToken.mockResolvedValue({ id: 'session_1' });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      email: 'admin@example.com',
      role: Role.SUPER_ADMIN,
      isActive: true,
    });
    jwtService.sign
      .mockReturnValueOnce('new-access-token')
      .mockReturnValueOnce('new-refresh-token');

    const result = await service.refreshToken('old-token');

    expect(sessionService.rotateRefreshToken).toHaveBeenCalledWith('refresh_old', expect.any(String));
    expect(result).toEqual({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    });
  });

  it('rejects revoked sessions', async () => {
    jwtService.verify.mockReturnValue({
      sub: 'user_1',
      role: Role.SUPER_ADMIN,
      refreshTokenId: 'refresh_old',
      type: 'refresh',
    });
    sessionService.isRefreshTokenValid.mockResolvedValue(false);

    await expect(service.refreshToken('old-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
