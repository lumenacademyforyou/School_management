// Minimal test harness: `npm test` loads every tests/*.test.ts through Vite and runs them here.
type TestFn = () => void | Promise<void>;

const tests: { name: string; fn: TestFn }[] = [];
let scope: string[] = [];

export const describe = (name: string, body: () => void) => {
  scope = [...scope, name];
  body();
  scope = scope.slice(0, -1);
};

export const test = (name: string, fn: TestFn) => tests.push({ name: [...scope, name].join(' › '), fn });

export const runAll = async (): Promise<number> => {
  let failed = 0;
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      failed += 1;
      console.log(`  ✗ ${t.name}\n      ${(e as Error).message.split('\n').join('\n      ')}`);
    }
  }
  console.log(`\n${tests.length - failed} passed, ${failed} failed, ${tests.length} total`);
  return failed;
};
