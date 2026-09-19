import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/auth/password.js';

describe('password hashing', () => {
  it('verifies a correct password', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(await verifyPassword('correct horse batteru', hash)).toBe(false);
  });

  it('salts, so the same password hashes differently every time', async () => {
    const [a, b] = await Promise.all([
      hashPassword('same password here'),
      hashPassword('same password here'),
    ]);
    expect(a).not.toBe(b);
  });

  it('never stores the password itself', async () => {
    const hash = await hashPassword('sup3rs3cretvalue');
    expect(hash).not.toContain('sup3rs3cretvalue');
    expect(hash.startsWith('scrypt$')).toBe(true);
  });

  it('refuses a password under 12 characters', async () => {
    await expect(hashPassword('short')).rejects.toThrow(/at least 12/);
  });

  it('returns false instead of throwing on a malformed stored hash', async () => {
    expect(await verifyPassword('anything', 'not-a-hash')).toBe(false);
    expect(await verifyPassword('anything', 'scrypt$x$y$z$q$r')).toBe(false);
    expect(await verifyPassword('anything', '')).toBe(false);
  });
});
