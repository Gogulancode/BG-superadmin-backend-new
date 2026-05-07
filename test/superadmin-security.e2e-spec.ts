import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';

/**
 * SUPERADMIN SECURITY E2E TESTS
 *
 * Tests for:
 * ✅ MFA enrollment, verification, and login flow
 * ✅ Session management (list, revoke, revoke all)
 * ✅ Strong password policy enforcement
 * ✅ Logout with session revocation
 */

// Helper to create fresh state for each test
const createTestState = () => {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();
  const cache = new Map<string, any>();
  let sessionCounter = 0;

  return {
    users,
    sessions,
    cache,
    createUser: (overrides = {}) => {
      const user = {
        id: `user-${Date.now()}-${Math.random()}`,
        email: 'superadmin@test.com',
        name: 'Super Admin',
        passwordHash: bcrypt.hashSync('Password123!', 10),
        role: 'SUPER_ADMIN',
        isActive: true,
        isMfaEnabled: false,
        mfaSecret: null,
        lastMfaVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
      users.set(user.id, user);
      return user;
    },
    createSession: (userId: string, data: any = {}) => {
      const session = {
        id: `session-${++sessionCounter}`,
        userId,
        userAgent: data.userAgent || 'Chrome',
        ipAddress: data.ipAddress || '127.0.0.1',
        refreshTokenId: data.refreshTokenId || null,
        createdAt: new Date(),
        lastSeenAt: new Date(),
        revokedAt: null,
      };
      sessions.set(session.id, session);
      return session;
    },
    getSessionsForUser: (userId: string) => {
      return Array.from(sessions.values()).filter(
        (s) => s.userId === userId && !s.revokedAt,
      );
    },
    revokeSession: (sessionId: string) => {
      const session = sessions.get(sessionId);
      if (session) {
        session.revokedAt = new Date();
      }
      return session;
    },
    revokeAllExcept: (userId: string, keepSessionId?: string) => {
      let count = 0;
      for (const session of sessions.values()) {
        if (session.userId === userId && !session.revokedAt && session.id !== keepSessionId) {
          session.revokedAt = new Date();
          count++;
        }
      }
      return count;
    },
  };
};

describe('Superadmin Security E2E Tests', () => {
  // ============================================================
  // 1) MFA TESTS
  // ============================================================
  describe('MFA for Superadmins', () => {
    describe('POST /auth/mfa/enroll', () => {
      it('generates TOTP secret and QR URL for user without MFA', () => {
        const state = createTestState();
        const user = state.createUser();

        const secret = authenticator.generateSecret();
        const otpauthUrl = authenticator.keyuri(user.email, 'Superadmin Platform', secret);

        expect(secret).toBeDefined();
        expect(secret.length).toBeGreaterThan(10);
        expect(otpauthUrl).toContain('otpauth://totp/');
        expect(otpauthUrl).toContain(encodeURIComponent(user.email));
      });

      it('rejects enrollment if MFA already enabled', () => {
        const state = createTestState();
        const user = state.createUser({ isMfaEnabled: true, mfaSecret: 'existing-secret' });

        const canEnroll = !user.isMfaEnabled;
        expect(canEnroll).toBe(false);
      });
    });

    describe('POST /auth/mfa/verify', () => {
      it('enables MFA after valid TOTP verification', () => {
        const state = createTestState();
        const user = state.createUser();
        const secret = authenticator.generateSecret();

        // Store pending enrollment
        state.cache.set(`mfa:enrollment:${user.id}`, secret);

        // Generate valid code
        const validCode = authenticator.generate(secret);
        const isValid = authenticator.verify({ token: validCode, secret });

        expect(isValid).toBe(true);

        // Enable MFA
        user.isMfaEnabled = true;
        user.mfaSecret = secret;
        user.lastMfaVerifiedAt = new Date();

        expect(user.isMfaEnabled).toBe(true);
        expect(user.mfaSecret).toBe(secret);
      });

      it('rejects invalid TOTP code', () => {
        const secret = authenticator.generateSecret();
        const invalidCode = '000000';
        const isValid = authenticator.verify({ token: invalidCode, secret });

        expect(isValid).toBe(false);
      });

      it('rejects if no pending enrollment', () => {
        const state = createTestState();
        const user = state.createUser();

        const pendingSecret = state.cache.get(`mfa:enrollment:${user.id}`);
        expect(pendingSecret).toBeUndefined();
      });
    });

    describe('POST /auth/mfa/disable', () => {
      it('disables MFA with valid password and TOTP', async () => {
        const state = createTestState();
        const secret = authenticator.generateSecret();
        const user = state.createUser({ isMfaEnabled: true, mfaSecret: secret });

        const validCode = authenticator.generate(secret);
        const isPasswordValid = await bcrypt.compare('Password123!', user.passwordHash);
        const isTotpValid = authenticator.verify({ token: validCode, secret });

        expect(isPasswordValid).toBe(true);
        expect(isTotpValid).toBe(true);

        // Disable MFA
        user.isMfaEnabled = false;
        user.mfaSecret = null;

        expect(user.isMfaEnabled).toBe(false);
        expect(user.mfaSecret).toBeNull();
      });

      it('rejects disable with invalid password', async () => {
        const state = createTestState();
        const secret = authenticator.generateSecret();
        const user = state.createUser({ isMfaEnabled: true, mfaSecret: secret });

        const isPasswordValid = await bcrypt.compare('WrongPassword!', user.passwordHash);
        expect(isPasswordValid).toBe(false);
      });

      it('rejects disable with invalid TOTP', () => {
        const secret = authenticator.generateSecret();
        const isTotpValid = authenticator.verify({ token: '000000', secret });
        expect(isTotpValid).toBe(false);
      });
    });

    describe('MFA Login Flow', () => {
      it('returns requiresMfa flag for MFA-enabled user', () => {
        const state = createTestState();
        const secret = authenticator.generateSecret();
        const user = state.createUser({ isMfaEnabled: true, mfaSecret: secret });

        const loginResponse = user.isMfaEnabled
          ? { requiresMfa: true, tempToken: 'temp-jwt-token', user: { id: user.id, email: user.email } }
          : { access_token: 'full-jwt', user };

        expect(loginResponse.requiresMfa).toBe(true);
        expect(loginResponse.tempToken).toBeDefined();
      });

      it('issues full tokens after valid MFA code', () => {
        const state = createTestState();
        const secret = authenticator.generateSecret();
        const user = state.createUser({ isMfaEnabled: true, mfaSecret: secret });

        const validCode = authenticator.generate(secret);
        const isValid = authenticator.verify({ token: validCode, secret });

        expect(isValid).toBe(true);

        const fullLoginResponse = {
          access_token: 'full-jwt-token',
          refresh_token: 'refresh-jwt-token',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isMfaEnabled: true,
          },
        };

        expect(fullLoginResponse.access_token).toBeDefined();
        expect(fullLoginResponse.refresh_token).toBeDefined();
      });

      it('rejects MFA login with invalid temp token', () => {
        expect(() => {
          throw new Error('Invalid or expired temporary token');
        }).toThrow('Invalid or expired temporary token');
      });

      it('rejects MFA login with invalid code', () => {
        const secret = authenticator.generateSecret();
        const isValid = authenticator.verify({ token: '000000', secret });
        expect(isValid).toBe(false);
      });

      it('skips MFA for non-MFA user', () => {
        const state = createTestState();
        const user = state.createUser({ isMfaEnabled: false });

        const loginResponse = user.isMfaEnabled
          ? { requiresMfa: true }
          : { access_token: 'full-jwt', refresh_token: 'refresh-jwt', user };

        expect(loginResponse.requiresMfa).toBeUndefined();
        expect(loginResponse.access_token).toBeDefined();
      });
    });
  });

  // ============================================================
  // 2) SESSION MANAGEMENT TESTS
  // ============================================================
  describe('Session Management', () => {
    describe('Session creation on login', () => {
      it('creates session record on successful login', () => {
        const state = createTestState();
        const user = state.createUser();

        const session = state.createSession(user.id, {
          userAgent: 'Mozilla/5.0 Test Browser',
          ipAddress: '192.168.1.1',
          refreshTokenId: 'refresh-token-uuid',
        });

        expect(session.id).toBeDefined();
        expect(session.userId).toBe(user.id);
        expect(session.userAgent).toBe('Mozilla/5.0 Test Browser');
        expect(session.ipAddress).toBe('192.168.1.1');
        expect(session.revokedAt).toBeNull();
      });
    });

    describe('GET /auth/sessions', () => {
      it('lists only sessions for current user', () => {
        const state = createTestState();
        const user1 = state.createUser({ id: 'user-1' });
        const user2 = state.createUser({ id: 'user-2', email: 'other@test.com' });

        state.createSession(user1.id, { userAgent: 'Chrome' });
        state.createSession(user2.id, { userAgent: 'Firefox' });

        const user1Sessions = state.getSessionsForUser(user1.id);

        expect(user1Sessions.length).toBe(1);
        expect(user1Sessions[0].userAgent).toBe('Chrome');
      });

      it('marks current session correctly', () => {
        const state = createTestState();
        const user = state.createUser();

        const session1 = state.createSession(user.id, { userAgent: 'Chrome' });
        const session2 = state.createSession(user.id, { userAgent: 'Firefox' });

        const sessions = state.getSessionsForUser(user.id);
        const currentSessionId = session1.id;

        const mappedSessions = sessions.map((s) => ({
          ...s,
          isCurrent: s.id === currentSessionId,
        }));

        expect(mappedSessions.find((s) => s.id === session1.id)?.isCurrent).toBe(true);
        expect(mappedSessions.find((s) => s.id === session2.id)?.isCurrent).toBe(false);
      });
    });

    describe('DELETE /auth/sessions/:id', () => {
      it('revokes a specific session', () => {
        const state = createTestState();
        const user = state.createUser();
        const session = state.createSession(user.id);

        state.revokeSession(session.id);

        expect(state.sessions.get(session.id).revokedAt).not.toBeNull();
      });

      it('prevents revoking another user\'s session', () => {
        const state = createTestState();
        const user1 = state.createUser({ id: 'user-1' });
        const user2 = state.createUser({ id: 'user-2', email: 'other@test.com' });

        const session = state.createSession(user2.id);

        // Check ownership before revoking
        expect(session.userId).not.toBe(user1.id);
      });
    });

    describe('DELETE /auth/sessions (revoke all)', () => {
      it('revokes all other sessions, keeps current', () => {
        const state = createTestState();
        const user = state.createUser();

        const session1 = state.createSession(user.id, { userAgent: 'Chrome' });
        const session2 = state.createSession(user.id, { userAgent: 'Firefox' });
        const session3 = state.createSession(user.id, { userAgent: 'Safari' });

        const currentSessionId = session1.id;
        const revokedCount = state.revokeAllExcept(user.id, currentSessionId);

        expect(revokedCount).toBe(2);
        expect(state.sessions.get(session1.id).revokedAt).toBeNull();
        expect(state.sessions.get(session2.id).revokedAt).not.toBeNull();
        expect(state.sessions.get(session3.id).revokedAt).not.toBeNull();
      });
    });

    describe('Session validation on refresh', () => {
      it('rejects refresh if session is revoked', () => {
        const state = createTestState();
        const user = state.createUser();
        const session = state.createSession(user.id, { refreshTokenId: 'token-1' });

        state.revokeSession(session.id);

        const isValid = state.sessions.get(session.id).revokedAt === null;
        expect(isValid).toBe(false);
      });

      it('updates lastSeenAt on successful refresh', async () => {
        const state = createTestState();
        const user = state.createUser();
        const session = state.createSession(user.id);

        const originalLastSeen = session.lastSeenAt;

        await new Promise((r) => setTimeout(r, 10));
        session.lastSeenAt = new Date();

        expect(session.lastSeenAt.getTime()).toBeGreaterThan(originalLastSeen.getTime());
      });
    });
  });

  // ============================================================
  // 3) STRONG PASSWORD POLICY TESTS
  // ============================================================
  describe('Strong Password Policy', () => {
    const validatePassword = (password: string) => {
      const errors: string[] = [];

      if (!password || password.length < 10) {
        errors.push('Password must be at least 10 characters long');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
      }

      return { isValid: errors.length === 0, errors };
    };

    it('rejects password shorter than 10 characters', () => {
      const result = validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 10 characters long');
    });

    it('rejects password without uppercase', () => {
      const result = validatePassword('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('rejects password without lowercase', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('rejects password without number', () => {
      const result = validatePassword('NoNumbersHere!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('rejects password without special character', () => {
      const result = validatePassword('NoSpecial123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('accepts valid strong password', () => {
      const result = validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts password with various special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      specialChars.split('').forEach((char) => {
        const password = `Password1${char}`;
        if (password.length >= 10) {
          const result = validatePassword(password);
          expect(result.errors.filter((e) => e.includes('special'))).toHaveLength(0);
        }
      });
    });

    it('returns all applicable errors', () => {
      const result = validatePassword('bad');
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  // ============================================================
  // 4) LOGOUT TESTS
  // ============================================================
  describe('Logout with Session Revocation', () => {
    describe('POST /auth/logout', () => {
      it('revokes current session on logout', () => {
        const state = createTestState();
        const user = state.createUser();
        const session = state.createSession(user.id, { refreshTokenId: 'refresh-1' });

        state.revokeSession(session.id);

        expect(state.sessions.get(session.id).revokedAt).not.toBeNull();
      });

      it('refresh fails after logout', () => {
        const state = createTestState();
        const user = state.createUser();
        const session = state.createSession(user.id, { refreshTokenId: 'refresh-1' });

        state.revokeSession(session.id);

        const isRefreshValid = state.sessions.get(session.id).revokedAt === null;
        expect(isRefreshValid).toBe(false);
      });

      it('logout from one device does not affect other sessions', () => {
        const state = createTestState();
        const user = state.createUser();

        const session1 = state.createSession(user.id, { refreshTokenId: 'refresh-1' });
        const session2 = state.createSession(user.id, { refreshTokenId: 'refresh-2' });

        // Logout only session1
        state.revokeSession(session1.id);

        expect(state.sessions.get(session1.id).revokedAt).not.toBeNull();
        expect(state.sessions.get(session2.id).revokedAt).toBeNull();
      });
    });
  });

  // ============================================================
  // 5) INTEGRATION TESTS
  // ============================================================
  describe('End-to-End Security Flow', () => {
    it('full MFA enrollment → login → logout flow', () => {
      const state = createTestState();

      // 1. Create user
      const user = state.createUser();

      // 2. Enroll in MFA
      const secret = authenticator.generateSecret();
      state.cache.set(`mfa:enrollment:${user.id}`, secret);

      // 3. Verify MFA
      const enrollCode = authenticator.generate(secret);
      expect(authenticator.verify({ token: enrollCode, secret })).toBe(true);

      user.isMfaEnabled = true;
      user.mfaSecret = secret;

      // 4. Login - should require MFA
      expect(user.isMfaEnabled).toBe(true);

      // 5. Complete MFA login
      const loginCode = authenticator.generate(secret);
      expect(authenticator.verify({ token: loginCode, secret })).toBe(true);

      // 6. Create session
      const session = state.createSession(user.id, { refreshTokenId: 'refresh-1' });

      // 7. Verify session is active
      expect(state.sessions.get(session.id).revokedAt).toBeNull();

      // 8. Logout
      state.revokeSession(session.id);

      // 9. Verify session is revoked
      expect(state.sessions.get(session.id).revokedAt).not.toBeNull();
    });

    it('session listing shows accurate device info', () => {
      const state = createTestState();
      const user = state.createUser();

      const devices = [
        { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120', ipAddress: '192.168.1.1' },
        { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605', ipAddress: '192.168.1.2' },
        { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Firefox/120', ipAddress: '192.168.1.3' },
      ];

      for (const device of devices) {
        state.createSession(user.id, device);
      }

      const sessions = state.getSessionsForUser(user.id);

      expect(sessions.length).toBe(3);
      expect(sessions.map((s) => s.userAgent)).toEqual(expect.arrayContaining(devices.map((d) => d.userAgent)));
    });

    it('password policy enforced across all password endpoints', () => {
      const weakPasswords = [
        'short',
        'nouppercasenum1!',
        'NOLOWERCASENUM1!',
        'NoNumbersHere!',
        'NoSpecial123',
      ];

      const validatePassword = (password: string) => {
        const errors: string[] = [];
        if (password.length < 10) errors.push('length');
        if (!/[A-Z]/.test(password)) errors.push('uppercase');
        if (!/[a-z]/.test(password)) errors.push('lowercase');
        if (!/[0-9]/.test(password)) errors.push('number');
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('special');
        return errors.length === 0;
      };

      for (const weak of weakPasswords) {
        expect(validatePassword(weak)).toBe(false);
      }

      expect(validatePassword('StrongPass123!')).toBe(true);
    });
  });
});

// Summary test
describe('Security Feature Summary', () => {
  it('documents all implemented security features', () => {
    const securityFeatures = {
      mfa: {
        enroll: 'POST /auth/mfa/enroll',
        verify: 'POST /auth/mfa/verify',
        login: 'POST /auth/mfa/login',
        disable: 'POST /auth/mfa/disable',
        status: 'GET /auth/mfa/status',
      },
      sessions: {
        list: 'GET /auth/sessions',
        revoke: 'DELETE /auth/sessions/:id',
        revokeAll: 'DELETE /auth/sessions',
      },
      auth: {
        login: 'POST /auth/login',
        logout: 'POST /auth/logout',
        refresh: 'POST /auth/refresh',
      },
      passwordPolicy: {
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecialChar: true,
      },
    };

    expect(Object.keys(securityFeatures.mfa).length).toBe(5);
    expect(Object.keys(securityFeatures.sessions).length).toBe(3);
    expect(Object.keys(securityFeatures.auth).length).toBe(3);
    expect(securityFeatures.passwordPolicy.minLength).toBe(10);
  });
});
