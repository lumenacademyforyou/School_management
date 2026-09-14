import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import type { Config } from '../../config.js';
import { withTenant } from '../../db/tenantContext.js';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { badRequest, notFound } from '../errors.js';

const createBody = z.object({
  fullName: z.string().min(1),
  classLabel: z.string().min(1),
});

/**
 * A worked example of a tenant-scoped product route, and the surface the
 * isolation tests exercise. The SIS story replaces it; the shape — authenticate,
 * requirePermission, then every query inside withTenant — is what product
 * routes copy.
 */
export function studentRoutes(config: Config, pool?: Pool): Router {
  const router = Router();
  router.use(authenticate(config));

  router.get('/', requirePermission('student:read'), async (req, res, next) => {
    try {
      const students = await withTenant(req.principal!.tenantId, async (client) => {
        const { rows } = await client.query(
          'SELECT id, full_name AS "fullName", class_label AS "classLabel" FROM student_records ORDER BY full_name',
        );
        return rows;
      }, pool);
      res.json({ students });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', requirePermission('student:read'), async (req, res, next) => {
    try {
      const student = await withTenant(req.principal!.tenantId, async (client) => {
        const { rows } = await client.query(
          'SELECT id, full_name AS "fullName", class_label AS "classLabel" FROM student_records WHERE id = $1',
          [req.params.id],
        );
        return rows[0] ?? null;
      }, pool);
      // A row belonging to another tenant is invisible here, so this is a 404
      // for "does not exist" and "not yours" alike — the caller cannot tell
      // the two apart, which is the point.
      if (!student) return next(notFound('No such student'));
      res.json(student);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', requirePermission('student:manage'), async (req, res, next) => {
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) return next(badRequest('Invalid student', parsed.error.issues));
    try {
      const tenantId = req.principal!.tenantId;
      const student = await withTenant(tenantId, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO student_records (tenant_id, full_name, class_label)
           VALUES ($1, $2, $3)
           RETURNING id, full_name AS "fullName", class_label AS "classLabel"`,
          [tenantId, parsed.data.fullName, parsed.data.classLabel],
        );
        return rows[0];
      }, pool);
      res.status(201).json(student);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
