import { loadConfig } from './config.js';
import { getPool, closePool } from './db/pool.js';
import { assertRlsEnforced } from './db/assertRlsEnforced.js';
import { createApp } from './http/app.js';

const config = loadConfig();
const pool = getPool(config.databaseUrl);

/**
 * Turns a startup database failure into something a developer can act on.
 *
 * The common one has a misleading message: the app connects as lumen_app, but
 * migration 0002 creates that role without a login, so until `npm run migrate`
 * has set its password the server cannot connect. Postgres reports that as
 * "password authentication failed"; Supabase's pooler reports it as
 * "user not found in the database". Neither says what to do.
 */
function explainStartupFailure(error: unknown): string {
  const code = (error as { code?: string }).code;
  const message = (error as Error).message ?? String(error);

  // 28P01 invalid_password, 28000 invalid_authorization_specification, and
  // Supavisor's EAUTHQUERY, which arrives as a generic XX000.
  const looksLikeAuth =
    code === '28P01' ||
    code === '28000' ||
    /EAUTHQUERY|user not found in the database|password authentication failed/i.test(message);

  if (looksLikeAuth) {
    return [
      `Could not sign in to the database: ${message}`,
      '',
      'The application connects as the lumen_app role, which has no password',
      'until the migrations set one. Run these first, in order:',
      '',
      '  npm run migrate    (uses ADMIN_DATABASE_URL; sets LUMEN_APP_PASSWORD)',
      '  npm run seed',
      '',
      'LUMEN_APP_PASSWORD must match the password inside DATABASE_URL.',
    ].join('\n');
  }

  if (/SELF_SIGNED_CERT|certificate/i.test(message)) {
    return [
      `Could not reach the database over TLS: ${message}`,
      '',
      'Hosted databases usually need an explicit TLS mode. For development append',
      '"?uselibpqcompat=true&sslmode=require" to the connection string; in',
      'production use sslmode=verify-full with the provider\'s CA certificate.',
    ].join('\n');
  }

  return message;
}

// Before serving a single request: if this connection can bypass the tenant
// boundary there is nothing worth serving.
try {
  await assertRlsEnforced(pool);
} catch (error) {
  console.error(explainStartupFailure(error));
  process.exit(1);
}

const server = createApp(config, pool).listen(config.port, () => {
  console.log(`Platform foundation listening on :${config.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => {
      void closePool().then(() => process.exit(0));
    });
  });
}
