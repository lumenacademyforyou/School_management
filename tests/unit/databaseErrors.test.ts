import { describe, expect, it } from 'vitest';
import { ReferenceNotFoundError } from '../../src/db/referenceNotFound.js';
import { fromDatabaseError, isForeignKeyViolation } from '../../src/http/databaseErrors.js';

const DRIVER_TEXT = 'duplicate key value violates unique constraint (tenant_id)=(4f1c…) SELECT secret';

const pgError = (code: string, constraint?: string) =>
  Object.assign(new Error(DRIVER_TEXT), { code, ...(constraint ? { constraint } : {}) });

describe('fromDatabaseError', () => {
  it('turns a named constraint into a message an administrator can act on', () => {
    const error = fromDatabaseError(pgError('23P01', 'academic_years_no_overlap'));
    expect(error).toMatchObject({ status: 409, code: 'conflict' });
    expect(error!.message).toMatch(/overlap/);
  });

  it('reports a failed reference as a bad request naming what was missing', () => {
    expect(fromDatabaseError(pgError('23503', 'sections_class_fkey'))).toMatchObject({
      status: 400,
      message: 'No such class',
    });
    expect(fromDatabaseError(new ReferenceNotFoundError('section'))).toMatchObject({
      status: 400,
      message: 'No such section',
    });
  });

  it('falls back on the SQLSTATE for constraints it has no message for', () => {
    expect(fromDatabaseError(pgError('23505', 'some_future_key'))).toMatchObject({ status: 409 });
    expect(fromDatabaseError(pgError('23514'))).toMatchObject({ status: 400 });
    expect(fromDatabaseError(pgError('22P02'))).toMatchObject({ status: 400 });
  });

  it('never repeats the driver’s message, which can quote values and SQL', () => {
    for (const code of ['23505', '23503', '23514', '23P01', '22P02']) {
      expect(fromDatabaseError(pgError(code))!.message).not.toContain('secret');
    }
  });

  it('leaves everything else to the generic 500', () => {
    expect(fromDatabaseError(new Error('boom'))).toBeUndefined();
    expect(fromDatabaseError(Object.assign(new Error('refused'), { code: 'ECONNREFUSED' }))).toBeUndefined();
    expect(fromDatabaseError(pgError('42P01'))).toBeUndefined(); // undefined table: a bug, not bad input
    expect(fromDatabaseError('not even an error')).toBeUndefined();
  });
});

describe('isForeignKeyViolation', () => {
  it('recognises only SQLSTATE 23503', () => {
    expect(isForeignKeyViolation(pgError('23503'))).toBe(true);
    expect(isForeignKeyViolation(pgError('23505'))).toBe(false);
    expect(isForeignKeyViolation(new Error('23503'))).toBe(false);
  });
});
