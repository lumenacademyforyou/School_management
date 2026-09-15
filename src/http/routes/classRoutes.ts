import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import type { Config } from '../../config.js';
import {
  createClasses,
  deleteClass,
  listClasses,
  updateClass,
} from '../../repositories/schoolStructureRepository.js';
import { isForeignKeyViolation } from '../databaseErrors.js';
import { conflict, notFound } from '../errors.js';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { idParam, parseBody } from '../validate.js';

const name = z.string().trim().min(1).max(40);
const displayOrder = z.number().int().min(0).max(1000);
const classInput = z.object({ name, displayOrder: displayOrder.optional() });

const bulkBody = z.object({ classes: z.array(classInput).min(1).max(50) });

const updateBody = z
  .object({ name: name.optional(), displayOrder: displayOrder.optional() })
  .refine((b) => b.name !== undefined || b.displayOrder !== undefined, {
    message: 'Send at least one field to change',
  });

export function classRoutes(config: Config, pool?: Pool): Router {
  const router = Router();
  router.use(authenticate(config));

  router.get('/', requirePermission('class:read'), async (req, res) => {
    res.json({ classes: await listClasses(req.principal!.tenantId, pool) });
  });

  router.post('/', requirePermission('class:manage'), async (req, res) => {
    const body = parseBody(classInput, req.body, 'class');
    const [created] = await createClasses(req.principal!.tenantId, [body], pool);
    res.status(201).json(created);
  });

  // The wizard's "LKG to Class 12 in one go". One transaction: a duplicate
  // name anywhere in the list creates none of them.
  router.post('/bulk', requirePermission('class:manage'), async (req, res) => {
    const body = parseBody(bulkBody, req.body, 'classes');
    res.status(201).json({ classes: await createClasses(req.principal!.tenantId, body.classes, pool) });
  });

  router.patch('/:id', requirePermission('class:manage'), async (req, res) => {
    const id = idParam(req.params.id, 'class');
    const body = parseBody(updateBody, req.body, 'class');
    const updated = await updateClass(req.principal!.tenantId, id, body, pool);
    if (!updated) throw notFound('No such class');
    res.json(updated);
  });

  router.delete('/:id', requirePermission('class:manage'), async (req, res) => {
    const id = idParam(req.params.id, 'class');
    let deleted: boolean;
    try {
      deleted = await deleteClass(req.principal!.tenantId, id, pool);
    } catch (error) {
      if (isForeignKeyViolation(error)) throw conflict('This class still has sections; remove them first');
      throw error;
    }
    if (!deleted) throw notFound('No such class');
    res.status(204).end();
  });

  return router;
}
