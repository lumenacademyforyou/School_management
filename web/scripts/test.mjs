// Runs tests/*.test.ts with Vite's module loader (TypeScript, same resolution as the apps). No test framework needed.
import fs from 'node:fs';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'error' });
let failed = 1;
try {
  const harness = await server.ssrLoadModule('/tests/harness.ts');
  const files = fs.readdirSync('tests').filter(f => /\.test\.tsx?$/.test(f)).sort();
  for (const file of files) {
    console.log(file);
    await server.ssrLoadModule(`/tests/${file}`);
  }
  failed = await harness.runAll();
} finally {
  await server.close();
}
process.exit(failed ? 1 : 0);
