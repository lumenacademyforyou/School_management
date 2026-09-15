import { permissionsForRoles, type Permission, type Role } from './permissions.js';

export interface Principal {
  userId: string;
  tenantId: string;
  email: string;
  roles: Role[];
}

/** True when any of the principal's roles grants `permission`. */
export function can(principal: Principal, permission: Permission): boolean {
  return permissionsForRoles(principal.roles).includes(permission);
}

/**
 * Which students a principal may see. Row level security already confines
 * everyone to their school; this is the second, narrower layer inside it.
 *
 * Decided by permission, never by role name: whoever holds `student:read` sees
 * the school, anyone else sees only students linked to their own login.
 * Defaulting to `linked` means a principal holding neither permission sees
 * nothing, not everything.
 */
export type StudentScope = { kind: 'all' } | { kind: 'linked'; userId: string };

export function studentScope(principal: Principal): StudentScope {
  return can(principal, 'student:read')
    ? { kind: 'all' }
    : { kind: 'linked', userId: principal.userId };
}

/**
 * The tenant boundary check, expressed once so every caller asks the same
 * question. The database enforces this too; this is the early, readable no.
 */
export function canAccessTenant(principal: Principal, tenantId: string): boolean {
  return principal.tenantId === tenantId;
}
