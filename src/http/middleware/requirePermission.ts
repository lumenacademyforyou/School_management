import type { NextFunction, Request, Response } from 'express';
import { can, canAccessTenant } from '../../rbac/authorize.js';
import type { Permission } from '../../rbac/permissions.js';
import { forbidden, unauthorized } from '../errors.js';

/** Gate a route on a permission rather than on a role. Use after `authenticate`. */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const principal = req.principal;
    if (!principal) {
      next(unauthorized());
      return;
    }
    if (!can(principal, permission)) {
      next(forbidden(`This action requires the "${permission}" permission`));
      return;
    }
    next();
  };
}

/**
 * For routes that name a tenant in the path. Refuses before any query runs, so
 * a cross-tenant attempt is a clean 403 rather than an empty 200 that leaks
 * whether the row exists.
 */
export function requireOwnTenant(param = 'tenantId') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const principal = req.principal;
    if (!principal) {
      next(unauthorized());
      return;
    }
    const requested = req.params[param];
    if (typeof requested === 'string' && !canAccessTenant(principal, requested)) {
      next(forbidden('This resource belongs to another tenant'));
      return;
    }
    next();
  };
}
