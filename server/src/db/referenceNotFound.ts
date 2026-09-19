/**
 * Thrown by a repository when a write names a row that is not visible in the
 * caller's tenant — missing, or another school's, which row level security
 * makes indistinguishable. Throwing inside withTenant rolls the whole write
 * back, so nothing is half-created.
 */
export class ReferenceNotFoundError extends Error {
  constructor(readonly what: string) {
    super(`No such ${what}`);
    this.name = 'ReferenceNotFoundError';
  }
}
