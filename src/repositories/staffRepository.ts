import type { Pool } from 'pg';
import { withTenant } from '../db/tenantContext.js';

export type StaffType = 'teaching' | 'non_teaching';
export type StaffStatus = 'active' | 'on_leave' | 'exited';

export interface StaffMember {
  id: string;
  employeeNo: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  staffType: StaffType;
  designation: string | null;
  dateOfJoining: string | null;
  status: StaffStatus;
  userId: string | null;
}

// Dates go out as their text form. node-postgres turns `date` into a JS Date
// at local midnight, which shifts the day for anyone east or west of the server.
const COLUMNS = `
  id, employee_no AS "employeeNo", full_name AS "fullName", email, phone,
  staff_type AS "staffType", designation, date_of_joining::text AS "dateOfJoining",
  status, user_id AS "userId"`;

export async function listStaff(
  tenantId: string,
  filter: { staffType?: StaffType; includeExited?: boolean } = {},
  pool?: Pool,
): Promise<StaffMember[]> {
  return withTenant(tenantId, async (client) => {
    const { rows } = await client.query<StaffMember>(
      `SELECT ${COLUMNS} FROM staff
        WHERE ($1::text IS NULL OR staff_type = $1)
          AND ($2 OR status <> 'exited')
        ORDER BY full_name`,
      [filter.staffType ?? null, filter.includeExited ?? false],
    );
    return rows;
  }, pool);
}

export async function findStaff(
  tenantId: string,
  id: string,
  pool?: Pool,
): Promise<StaffMember | null> {
  return withTenant(tenantId, async (client) => {
    const { rows } = await client.query<StaffMember>(`SELECT ${COLUMNS} FROM staff WHERE id = $1`, [id]);
    return rows[0] ?? null;
  }, pool);
}

export async function createStaff(
  tenantId: string,
  input: {
    employeeNo: string;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    staffType?: StaffType;
    designation?: string | null;
    dateOfJoining?: string | null;
    userId?: string | null;
  },
  pool?: Pool,
): Promise<StaffMember> {
  return withTenant(tenantId, async (client) => {
    const { rows } = await client.query<StaffMember>(
      `INSERT INTO staff (tenant_id, employee_no, full_name, email, phone, staff_type,
                          designation, date_of_joining, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${COLUMNS}`,
      [
        tenantId,
        input.employeeNo.trim(),
        input.fullName.trim(),
        input.email ?? null,
        input.phone ?? null,
        input.staffType ?? 'teaching',
        input.designation ?? null,
        input.dateOfJoining ?? null,
        input.userId ?? null,
      ],
    );
    return rows[0]!;
  }, pool);
}
