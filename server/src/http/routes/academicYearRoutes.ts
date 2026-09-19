import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import type { Config } from '../../config.js';
import {
  createAcademicYear,
  deleteAcademicYear,
  listAcademicYears,
  makeAcademicYearCurrent,
  updateAcademicYear,
} from '../../repositories/schoolStructureRepository.js';
import { isForeignKeyViolation } from '../databaseErrors.js';
import { conflict, notFound } from '../errors.js';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { idParam, parseBody } from '../validate.js';

const name = z.string().trim().min(1).max(40);

const createBody = z
  .object({
    name,
    startsOn: z.iso.date(),
    endsOn: z.iso.date(),
    makeCurrent: z.boolean().optional(),
  })
  // ISO dates compare correctly as strings.
  .refine((b) => b.endsOn > b.startsOn, { message: 'endsOn must be after startsOn', path: ['endsOn'] });

const updateBody = z
  .object({ name: name.optional(), startsOn: z.iso.date().optional(), endsOn: z.iso.date().optional() })
  .refine((b) => Object.values(b).some((v) => v !== undefined), {
    message: 'Send at least one field to change',
  });

/**
 * Academic years for the setup wizard. Class structure is school
 * configuration, so it sits under the `class:*` permissions rather than
 * growing a vocabulary of its own.
 *
 * Handlers are async and throw; Express 5 forwards a rejected promise to the
 * error handler, so there is no try/catch per route.
 */
export function academicYearRoutes(config: Config, pool?: Pool): Router {
  const router = Router();
  router.use(authenticate(config));

  router.get('/', requirePermission('class:read'), async (req, res) => {
    res.json({ academicYears: await listAcademicYears(req.principal!.tenantId, pool) });
  });

  router.post('/', requirePermission('class:manage'), async (req, res) => {
    const body = parseBody(createBody, req.body, 'academic year');
    res.status(201).json(await createAcademicYear(req.principal!.tenantId, body, pool));
  });

  router.patch('/:id', requirePermission('class:manage'), async (req, res) => {
    const id = idParam(req.params.id, 'academic year');
    const body = parseBody(updateBody, req.body, 'academic year');
    const year = await updateAcademicYear(req.principal!.tenantId, id, body, pool);
    if (!year) throw notFound('No such academic year');
    res.json(year);
  });

  router.post('/:id/make-current', requirePermission('class:manage'), async (req, res) => {
    const id = idParam(req.params.id, 'academic year');
    const year = await makeAcademicYearCurrent(req.principal!.tenantId, id, pool);
    if (!year) throw notFound('No such academic year');
    res.json(year);
  });

  router.delete('/:id', requirePermission('class:manage'), async (req, res) => {
    const id = idParam(req.params.id, 'academic year');
    let deleted: boolean;
    try {
      deleted = await deleteAcademicYear(req.principal!.tenantId, id, pool);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw conflict('This academic year still has sections; remove them first');
      }
      throw error;
    }
    if (!deleted) throw notFound('No such academic year');
    res.status(204).end();
  });

  return router;
}
