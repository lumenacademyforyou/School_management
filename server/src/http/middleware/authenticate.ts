import type { NextFunction, Request, Response } from 'express';
import type { Config } from '../../config.js';
import { InvalidTokenError, verifyAccessToken } from '../../auth/tokens.js';
import type { Principal } from '../../rbac/authorize.js';
import { unauthorized } from '../errors.js';

declare module 'express-serve-static-core' {
  interface Request {
    principal?: Principal;
  }
}

/**
 * Reads the bearer token and puts a principal on the request. The tenant comes
 * from the token and nowhere else — never from a header, query parameter or
 * body the caller controls.
 */
export function authenticate(config: Config) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.get('authorization') ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      next(unauthorized('Provide an Authorization: Bearer <token> header'));
      return;
    }

    try {
      const claims = verifyAccessToken(token, config);
      req.principal = {
        userId: claims.sub,
        tenantId: claims.tid,
        email: claims.email,
        roles: claims.roles,
      };
      next();
    } catch (error) {
      next(error instanceof InvalidTokenError ? unauthorized(error.message) : error);
    }
  };
}
