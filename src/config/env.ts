export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function requireJwtSecret(): string {
  const value = requireEnv('JWT_SECRET');
  const weakValues = new Set([
    'secret',
    'jwt-secret',
    'test-jwt-secret',
    'super-secret',
    'replace-with-at-least-32-random-characters',
  ]);

  if (value.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (weakValues.has(value.toLowerCase())) {
    throw new Error('JWT_SECRET must be a unique random value, not a placeholder');
  }

  return value;
}

export function optionalNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return value;
}
