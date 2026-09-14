import { z } from 'zod';

const schema = z.object({
  databaseUrl: z.string().min(1, 'is required'),
  jwtSecret: z.string().min(32, 'must be at least 32 characters'),
  accessTokenTtl: z.number().int().positive(),
  refreshTokenTtl: z.number().int().positive(),
  // 0 is allowed: it asks the OS for any free port, which is how the tests bind.
  port: z.number().int().min(0).max(65535),
  issuer: z.string().min(1),
  audience: z.string().min(1),
});

export type Config = z.infer<typeof schema>;

/** So a misconfiguration names the variable an operator has to set, not the field. */
const ENV_NAME: Record<string, string> = {
  databaseUrl: 'DATABASE_URL',
  jwtSecret: 'JWT_SECRET',
  accessTokenTtl: 'ACCESS_TOKEN_TTL',
  refreshTokenTtl: 'REFRESH_TOKEN_TTL',
  port: 'PORT',
  issuer: 'JWT_ISSUER',
  audience: 'JWT_AUDIENCE',
};

function int(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(`Expected an integer, got "${value}"`);
  return parsed;
}

/**
 * Reads configuration from the environment and fails loudly at startup rather
 * than at the first request. Never falls back to a default secret: a weak
 * signing key is the one misconfiguration that silently defeats the whole
 * auth layer.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse({
    databaseUrl: env.DATABASE_URL,
    jwtSecret: env.JWT_SECRET,
    accessTokenTtl: int(env.ACCESS_TOKEN_TTL, 900),
    refreshTokenTtl: int(env.REFRESH_TOKEN_TTL, 2_592_000),
    port: int(env.PORT, 3000),
    issuer: env.JWT_ISSUER ?? 'lumen-platform',
    audience: env.JWT_AUDIENCE ?? 'lumen-apps',
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => {
        const field = String(i.path[0] ?? '');
        return `${ENV_NAME[field] ?? field}: ${i.message}`;
      })
      .join('; ');
    throw new Error(`Invalid configuration — ${details}`);
  }
  return parsed.data;
}
