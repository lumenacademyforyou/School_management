import { z } from 'zod';
import { badRequest, notFound } from './errors.js';

export function parseBody<T extends z.ZodType>(schema: T, body: unknown, what: string): z.infer<T> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw badRequest(`Invalid ${what}`, parsed.error.issues);
  return parsed.data;
}

const uuid = z.uuid();

/**
 * A malformed id cannot name a row, so it gets the same 404 as a missing one —
 * and it never reaches SQL, where Postgres would reject the cast with a 500.
 */
export function idParam(value: unknown, what: string): string {
  const parsed = uuid.safeParse(value);
  if (!parsed.success) throw notFound(`No such ${what}`);
  return parsed.data;
}
