import { describe, expect, it } from 'vitest';
import {
  PERMISSIONS,
  ROLES,
  isRole,
  permissionsForRole,
  permissionsForRoles,
  type Permission,
} from '../../src/rbac/permissions.js';
import { can, canAccessTenant, type Principal } from '../../src/rbac/authorize.js';

const principal = (roles: Principal['roles'], tenantId = 'tenant-a'): Principal => ({
  userId: 'u1',
  tenantId,
  email: 'a@example.com',
  roles,
});

describe('role catalogue', () => {
  it('covers exactly the six roles the products use', () => {
    expect([...ROLES]).toEqual(['admin', 'teacher', 'office', 'parent', 'student', 'examiner']);
  });

  it('grants every role only permissions from the shared vocabulary', () => {
    for (const role of ROLES) {
      for (const permission of permissionsForRole(role)) {
        expect(PERMISSIONS).toContain(permission);
      }
    }
  });

  it('gives every role at least one permission', () => {
    for (const role of ROLES) {
      expect(permissionsForRole(role).length).toBeGreaterThan(0);
    }
  });

  it('recognises only known role names', () => {
    expect(isRole('teacher')).toBe(true);
    expect(isRole('superuser')).toBe(false);
    expect(isRole(42)).toBe(false);
  });
});

describe('permissionsForRoles', () => {
  it('unions the permissions of several roles without duplicates', () => {
    const combined = permissionsForRoles(['teacher', 'examiner']);
    expect(new Set(combined).size).toBe(combined.length);
    expect(combined).toContain('attendance:mark'); // teacher only
    expect(combined).toContain('paper:approve'); // examiner only
  });

  it('returns nothing for a user with no roles', () => {
    expect(permissionsForRoles([])).toEqual([]);
  });
});

describe('can', () => {
  const cases: Array<[Principal['roles'][number], Permission, boolean]> = [
    ['admin', 'user:manage', true],
    ['admin', 'fee:manage', true],
    ['teacher', 'attendance:mark', true],
    ['teacher', 'fee:manage', false],
    ['teacher', 'user:manage', false],
    ['office', 'student:manage', true],
    ['office', 'attendance:mark', false],
    ['parent', 'result:read', true],
    ['parent', 'student:manage', false],
    ['parent', 'attendance:mark', false],
    ['student', 'exam:attempt', true],
    ['student', 'exam:evaluate', false],
    ['examiner', 'paper:approve', true],
    ['examiner', 'student:read', false],
    ['examiner', 'fee:read', false],
  ];

  it.each(cases)('%s %s -> %s', (role, permission, expected) => {
    expect(can(principal([role]), permission)).toBe(expected);
  });

  it('never grants tenant:manage outside admin', () => {
    for (const role of ROLES) {
      if (role === 'admin') continue;
      expect(can(principal([role]), 'tenant:manage')).toBe(false);
    }
  });

  it('keeps student personal records away from external examiners', () => {
    expect(can(principal(['examiner']), 'student:read')).toBe(false);
    expect(can(principal(['examiner']), 'attendance:read')).toBe(false);
  });
});

describe('canAccessTenant', () => {
  it('allows a principal into its own tenant only', () => {
    expect(canAccessTenant(principal(['admin'], 'tenant-a'), 'tenant-a')).toBe(true);
    expect(canAccessTenant(principal(['admin'], 'tenant-a'), 'tenant-b')).toBe(false);
  });
});
