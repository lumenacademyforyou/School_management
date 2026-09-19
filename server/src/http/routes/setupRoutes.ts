import { Router } from 'express';
import type { Pool } from 'pg';
import type { Config } from '../../config.js';
import { getSetupStatus } from '../../repositories/schoolStructureRepository.js';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/requirePermission.js';

/**
 * The setup wizard's progress: which steps are done, and the counts behind
 * them. The wizard screen renders from this rather than keeping its own idea
 * of where the school is, so closing the browser halfway loses nothing.
 */
export function setupRoutes(config: Config, pool?: Pool): Router {
  const router = Router();
  router.use(authenticate(config));

  router.get('/status', requirePermission('class:read'), async (req, res) => {
    res.json(await getSetupStatus(req.principal!.tenantId, pool));
  });

  return router;
}
