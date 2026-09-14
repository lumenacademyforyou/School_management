import { loadConfig } from './config.js';
import { getPool, closePool } from './db/pool.js';
import { assertRlsEnforced } from './db/assertRlsEnforced.js';
import { createApp } from './http/app.js';

const config = loadConfig();
const pool = getPool(config.databaseUrl);

// Before serving a single request: if this connection can bypass the tenant
// boundary there is nothing worth serving.
await assertRlsEnforced(pool);

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
