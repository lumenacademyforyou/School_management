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
 * The tenant boundary check, expressed once so every caller asks the same
 * question. The database enforces this too; this is the early, readable no.
 */
export function canAccessTenant(principal: Principal, tenantId: string): boolean {
  return principal.tenantId === tenantId;
}
