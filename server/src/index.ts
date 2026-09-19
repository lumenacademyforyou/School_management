// Public surface of the shared foundation. The School MMS, QPG and Assessment
// apps import from here rather than reaching into src/ directly.
export { loadConfig, type Config } from './config.js';
export { createApp } from './http/app.js';
export { getPool, closePool } from './db/pool.js';
export { withTenant, withoutTenant } from './db/tenantContext.js';
export { assertRlsEnforced } from './db/assertRlsEnforced.js';
export { hashPassword, verifyPassword } from './auth/password.js';
export {
  signAccessToken,
  verifyAccessToken,
  InvalidTokenError,
  type AccessTokenClaims,
} from './auth/tokens.js';
export { login, refresh, logout, AuthError, type Session } from './auth/authService.js';
export {
  PERMISSIONS,
  ROLES,
  permissionsForRole,
  permissionsForRoles,
  isRole,
  type Permission,
  type Role,
} from './rbac/permissions.js';
export {
  can,
  canAccessTenant,
  studentScope,
  type Principal,
  type StudentScope,
} from './rbac/authorize.js';
export { authenticate } from './http/middleware/authenticate.js';
export {
  requirePermission,
  requireAnyPermission,
  requireOwnTenant,
} from './http/middleware/requirePermission.js';
export { errorHandler } from './http/middleware/errorHandler.js';
export {
  HttpError,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  conflict,
} from './http/errors.js';
export { ReferenceNotFoundError } from './db/referenceNotFound.js';
export * as tenantRepository from './repositories/tenantRepository.js';
export * as userRepository from './repositories/userRepository.js';
export * as schoolStructureRepository from './repositories/schoolStructureRepository.js';
export * as staffRepository from './repositories/staffRepository.js';
export * as studentRepository from './repositories/studentRepository.js';
