import type { Pool } from 'pg';
import { withoutTenant } from '../db/tenantContext.js';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  products: string[];
  status: 'active' | 'suspended' | 'archived';
}

const COLUMNS = 'id, slug, name, products, status';

export async function findTenantBySlug(slug: string, pool?: Pool): Promise<Tenant | null> {
  return withoutTenant(async (client) => {
    const { rows } = await client.query<Tenant>(
      `SELECT ${COLUMNS} FROM tenants WHERE slug = $1`,
      [slug.trim().toLowerCase()],
    );
    return rows[0] ?? null;
  }, pool);
}

export async function findTenantById(id: string, pool?: Pool): Promise<Tenant | null> {
  return withoutTenant(async (client) => {
    const { rows } = await client.query<Tenant>(
      `SELECT ${COLUMNS} FROM tenants WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }, pool);
}

export async function createTenant(
  input: { slug: string; name: string; products?: string[] },
  pool?: Pool,
): Promise<Tenant> {
  return withoutTenant(async (client) => {
    const { rows } = await client.query<Tenant>(
      `INSERT INTO tenants (slug, name, products)
       VALUES ($1, $2, COALESCE($3::text[], ARRAY['school']::text[]))
       RETURNING ${COLUMNS}`,
      [input.slug.trim().toLowerCase(), input.name, input.products ?? null],
    );
    return rows[0]!;
  }, pool);
}
