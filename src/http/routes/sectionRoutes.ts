import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import type { Config } from '../../config.js';
import {
  createSections,
  deleteSection,
  findCurrentAcademicYear,
  findSection,
  listSections,
  updateSection,
} from '../../repositories/schoolStructureRepository.js';
import { findStaff } from '../../repositories/staffRepository.js';
import { isForeignKeyViolation } from '../databaseErrors.js';
import { badRequest, conflict, notFound } from '../errors.js';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { idParam, parseBody } from '../validate.js';

const name = z.string().trim().min(1).max(20);
const capacity = z.number().int().min(1).max(500);

const listQuery = z.object({
  academicYearId: z.uuid().optional(),
  classId: z.uuid().optional(),
});

const createBody = z.object({
  academicYearId: z.uuid(),
  classId: z.uuid(),
  name,
  capacity: capacity.optional(),
  classTeacherId: z.uuid().optional(),
});

const bulkBody = z
  .object({
    academicYearId: z.uuid(),
    classIds: z.array(z.uuid()).min(1).max(50),
    names: z.array(name).min(1).max(26),
    capacity: capacity.optional(),
  })
  .refine((b) => b.classIds.length * b.names.length <= 500, {
    message: 'At most 500 sections per request',
  });

const updateBody = z
  .object({
    name: name.optional(),
    capacity: capacity.nullable().optional(),
    classTeacherId: z.uuid().nullable().optional(),
  })
  .refine((b) => Object.values(b).some((v) => v !== undefined), {
    message: 'Send at least one field to change',
  });

/**
 * The foreign key already guarantees the teacher is staff at this school. This
 * adds what the schema does not know: a class teacher teaches, and has not left.
 */
async function assertCanBeClassTeacher(tenantId: string, staffId: string, pool?: Pool) {
  const member = await findStaff(tenantId, staffId, pool);
  if (!member || member.staffType !== 'teaching' || member.status === 'exited') {
    throw badRequest('A class teacher must be a current member of teaching staff');
  }
}

export function sectionRoutes(config: Config, pool?: Pool): Router {
  const router = Router();
  router.use(authenticate(config));

  // Defaults to the current academic year: that is the one the wizard, and
  // almost every screen after it, is looking at.
  router.get('/', requirePermission('class:read'), async (req, res) => {
    const query = parseBody(listQuery, req.query, 'section filter');
    const tenantId = req.principal!.tenantId;
    const academicYearId =
      query.academicYearId ?? (await findCurrentAcademicYear(tenantId, pool))?.id ?? null;
    if (!academicYearId) {
      res.json({ academicYearId: null, sections: [] });
      return;
    }
    const sections = await listSections(tenantId, { academicYearId, classId: query.classId }, pool);
    res.json({ academicYearId, sections });
  });

  router.get('/:id', requirePermission('class:read'), async (req, res) => {
    const id = idParam(req.params.id, 'section');
    const section = await findSection(req.principal!.tenantId, id, pool);
    if (!section) throw notFound('No such section');
    res.json(section);
  });

  router.post('/', requirePermission('class:manage'), async (req, res) => {
    const body = parseBody(createBody, req.body, 'section');
    const tenantId = req.principal!.tenantId;
    if (body.classTeacherId) await assertCanBeClassTeacher(tenantId, body.classTeacherId, pool);
    const [created] = await createSections(tenantId, [body], pool);
    res.status(201).json(created);
  });

  // Every listed class gets every listed section name — "A, B and C for
  // Classes 1 to 10" is one request. All or none.
  router.post('/bulk', requirePermission('class:manage'), async (req, res) => {
    const body = parseBody(bulkBody, req.body, 'sections');
    const inputs = body.classIds.flatMap((classId) =>
      body.names.map((sectionName) => ({
        academicYearId: body.academicYearId,
        classId,
        name: sectionName,
        capacity: body.capacity,
      })),
    );
    res.status(201).json({ sections: await createSections(req.principal!.tenantId, inputs, pool) });
  });

  router.patch('/:id', requirePermission('class:manage'), async (req, res) => {
    const id = idParam(req.params.id, 'section');
    const body = parseBody(updateBody, req.body, 'section');
    const tenantId = req.principal!.tenantId;
    if (body.classTeacherId) await assertCanBeClassTeacher(tenantId, body.classTeacherId, pool);
    const updated = await updateSection(tenantId, id, body, pool);
    if (!updated) throw notFound('No such section');
    res.json(updated);
  });

  router.delete('/:id', requirePermission('class:manage'), async (req, res) => {
    const id = idParam(req.params.id, 'section');
    let deleted: boolean;
    try {
      deleted = await deleteSection(req.principal!.tenantId, id, pool);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw conflict('This section still has students enrolled; move them first');
      }
      throw error;
    }
    if (!deleted) throw notFound('No such section');
    res.status(204).end();
  });

  return router;
}
