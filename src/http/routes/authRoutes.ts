import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import type { Config } from '../../config.js';
import { login, logout, refresh } from '../../auth/authService.js';
import { permissionsForRoles } from '../../rbac/permissions.js';
import { authenticate } from '../middleware/authenticate.js';
import { badRequest, unauthorized } from '../errors.js';

const loginBody = z.object({
  tenantSlug: z.string().min(1),
  email: z.email(),
  password: z.string().min(1),
});

const refreshBody = z.object({
  tenantSlug: z.string().min(1),
  refreshToken: z.string().min(1),
});

const logoutBody = z.object({ refreshToken: z.string().min(1) });

export function authRoutes(config: Config, pool?: Pool): Router {
  const router = Router();

  router.post('/login', async (req, res, next) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) return next(badRequest('Invalid login request', parsed.error.issues));
    try {
      res.json(await login(parsed.data, config, pool));
    } catch (error) {
      next(error);
    }
  });

  router.post('/refresh', async (req, res, next) => {
    const parsed = refreshBody.safeParse(req.body);
    if (!parsed.success) return next(badRequest('Invalid refresh request', parsed.error.issues));
    try {
      res.json(await refresh(parsed.data, config, pool));
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', authenticate(config), async (req, res, next) => {
    const parsed = logoutBody.safeParse(req.body);
    if (!parsed.success) return next(badRequest('Invalid logout request', parsed.error.issues));
    try {
      await logout({ tenantId: req.principal!.tenantId, refreshToken: parsed.data.refreshToken }, pool);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  router.get('/me', authenticate(config), (req, res, next) => {
    const principal = req.principal;
    if (!principal) return next(unauthorized());
    res.json({
      id: principal.userId,
      tenantId: principal.tenantId,
      email: principal.email,
      roles: principal.roles,
      permissions: permissionsForRoles(principal.roles),
    });
  });

  return router;
}
