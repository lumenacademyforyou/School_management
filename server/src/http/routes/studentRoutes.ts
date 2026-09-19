import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import type { Config } from '../../config.js';
import { studentScope } from '../../rbac/authorize.js';
import { createStudent, findStudent, listStudents } from '../../repositories/studentRepository.js';
import { notFound } from '../errors.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireAnyPermission, requirePermission } from '../middleware/requirePermission.js';
import { idParam, parseBody } from '../validate.js';

const createBody = z
  .object({
    admissionNo: z.string().trim().min(1).max(40),
    fullName: z.string().trim().min(1).max(200),
    dateOfBirth: z.iso.date().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    admissionDate: z.iso.date().optional(),
    sectionId: z.uuid().optional(),
    rollNo: z.number().int().min(1).max(10000).optional(),
  })
  .refine((b) => b.rollNo === undefined || b.sectionId !== undefined, {
    message: 'rollNo is a position in a section, so it needs a sectionId',
    path: ['rollNo'],
  });

/**
 * Students on the SIS schema. Two layers decide what a caller sees: row level
 * security confines them to their school, and `studentScope` narrows parents
 * and students to the records linked to their own login.
 *
 * Update, delete and spreadsheet import arrive with Jira LS-38.
 */
export function studentRoutes(config: Config, pool?: Pool): Router {
  const router = Router();
  router.use(authenticate(config));

  router.get('/', requireAnyPermission('student:read', 'student:read_own'), async (req, res) => {
    const principal = req.principal!;
    res.json({ students: await listStudents(principal.tenantId, studentScope(principal), pool) });
  });

  router.get('/:id', requireAnyPermission('student:read', 'student:read_own'), async (req, res) => {
    const principal = req.principal!;
    const id = idParam(req.params.id, 'student');
    const student = await findStudent(principal.tenantId, id, studentScope(principal), pool);
    // Another school's student, and a student at this school who is not the
    // caller's, both come back as the same 404 — neither confirms the id.
    if (!student) throw notFound('No such student');
    res.json(student);
  });

  router.post('/', requirePermission('student:manage'), async (req, res) => {
    const body = parseBody(createBody, req.body, 'student');
    res.status(201).json(await createStudent(req.principal!.tenantId, body, pool));
  });

  return router;
}
