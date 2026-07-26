import { optionalNumberEnv, requireEnv, requireJwtSecret } from './env';

describe('environment validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('requires configured environment variables', () => {
    delete process.env.REQUIRED_VALUE;

    expect(() => requireEnv('REQUIRED_VALUE')).toThrow('REQUIRED_VALUE is required');
  });

  it('rejects short or placeholder JWT secrets', () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    expect(() => requireJwtSecret()).toThrow('JWT_SECRET must be at least 32 characters long');

    process.env.JWT_SECRET = 'replace-with-at-least-32-random-characters';
    expect(() => requireJwtSecret()).toThrow('JWT_SECRET must be a unique random value');
  });

  it('accepts a strong JWT secret', () => {
    process.env.JWT_SECRET = 'superadmin-unit-test-secret-32-characters-minimum';

    expect(requireJwtSecret()).toBe('superadmin-unit-test-secret-32-characters-minimum');
  });

  it('validates positive numeric environment variables', () => {
    process.env.POSITIVE_VALUE = '25';
    process.env.INVALID_VALUE = '-1';

    expect(optionalNumberEnv('POSITIVE_VALUE', 10)).toBe(25);
    expect(optionalNumberEnv('MISSING_VALUE', 10)).toBe(10);
    expect(() => optionalNumberEnv('INVALID_VALUE', 10)).toThrow('INVALID_VALUE must be a positive number');
  });
});
