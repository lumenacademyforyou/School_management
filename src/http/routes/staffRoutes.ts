import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import type { Config } from '../../config.js';
import { listStaff } from '../../repositories/staffRepository.js';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { parseBody } from '../validate.js';

const listQuery = z.object({ staffType: z.enum(['teaching', 'non_teaching']).optional() });

/**
 * Read-only for now: the setup wizard needs to list teachers to assign as
 * class teachers. Creating and importing staff is Jira LS-38.
 */
export function staffRoutes(config: Config, pool?: Pool): Router {
  const router = Router();
  router.use(authenticate(config));

  router.get('/', requirePermission('staff:read'), async (req, res) => {
    const query = parseBody(listQuery, req.query, 'staff filter');
    res.json({ staff: await listStaff(req.principal!.tenantId, query, pool) });
  });

  return router;
}
