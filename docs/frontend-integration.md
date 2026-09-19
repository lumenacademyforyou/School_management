# Wiring the web apps onto the API

Design notes for the integration phase (Jira **LS-162** to **LS-176**, Sprint 2).
Read this before starting any of those tickets.

The repo now holds two halves that both work and do not yet talk to each other:

- `server/` — auth, RBAC, the tenant boundary and the SIS schema. 148 tests.
- `web/` — the staff console, parent app and teacher app. Every screen built,
  running on mock data in the browser.

Connecting them is not one task. It is a stack, and the order matters: each
layer below is the thing the next one stands on. Skipping ahead produces work
that has to be redone once the layer under it lands.

## Why the repo looks like this

`CSK-branch` carried the API; `ui_design` carried the three React apps. Both
used `src/`, `tests/`, `scripts/`, `package.json` and `tsconfig.json` — zero
content overlap, total path overlap. Neither branch could merge into the other
without deleting it: the open PR read `-11,082` lines and would have removed
the Express layer, all four migrations and the whole test suite, which are the
deliverables of LS-26, LS-27, LS-28 and LS-30.

npm workspaces resolved it (LS-162). The API moved to port **4000** at the same
time, because the web dev servers already occupy 3000-3004 and the two collided
on 3000.

The workspaces keep separate TypeScript versions and test runners on purpose.
Forcing that reconciliation during the move would have put avoidable risk under
four checkouts at once; it is LS-175, and it is not pilot-critical.

## The layers

| Layer | What | Jira |
| --- | --- | --- |
| L0 | One repo, one build, CI over both halves | LS-162, LS-164 |
| L1 | Typed API client — the seam everything else plugs into | LS-165 |
| L2 | Identity: real sign-in, one permission model | LS-166, LS-167, LS-168 |
| L3 | SIS core: student shape, setup screens, directory | LS-169, LS-170, LS-171 |
| L4 | Attendance and fees | LS-42, LS-44, LS-39, LS-40, LS-173 |
| L5 | Parent and teacher apps | LS-172 |
| L6 | Pilot readiness | LS-163, LS-174, LS-22, LS-34, LS-35, LS-36 |

## Three mismatches that will bite

These are not bugs. They are places where the two halves were designed
independently and disagree. Each needs a decision, not a patch.

### 1. The role models do not line up

The server has six capability roles — `admin`, `teacher`, `office`, `parent`,
`student`, `examiner` — and resolves permissions from the matrix in
`server/src/rbac/permissions.ts` on every request.

The web console has five job titles: Principal, Accountant, Admissions Officer,
Auditor, Exam Coordinator, with its own hardcoded grant table in
`web/src/data/staffAccess.ts`.

Those are two different axes. A job title is who someone is in the school; a
capability role is what the system lets them do. The product has to say which
one it uses, and the server has to stay the source of truth — it is the real
boundary, and a second copy of the rules in the client will drift from it.

`web/src/components/common/ReadOnlyGuard.tsx` is the sharp edge here. It decides
what a read-only role may click by **matching button labels in the DOM** against
a verb list. It was widened during the design pass and given explicit
`data-readonly-allow` / `data-readonly-block` escape hatches, but it remains a
heuristic. It is only ever an affordance — the server already refuses the action
— and it must not give a different answer from the server's. Serving the
caller's resolved permissions and driving state from those (LS-167) is what
retires it.

### 2. A student's class is a string in one half and a row in the other

The web apps carry `student.class` as `"Class 10"` and `student.section` as
`"A"` (`web/src/types.ts`).

The server models class membership as an `enrollments` row per academic year,
keyed `(tenant_id, section_id, academic_year_id)`. That is deliberate and
documented in [`sis-data-model.md`](sis-data-model.md): last year's rosters have
to survive this year's setup, and attendance, marks and fees all hang off the
enrollment.

Convert in **one** mapping module (LS-169). Translating ad hoc per screen is how
you end up with six subtly different ideas of what class a student is in.

The web `Student` type also carries `mentor`, `house`, `gpa`, `feeStatus`,
`transportRoute` and `hostelRoom`, none of which exist in `0004_sis_core.sql`.
Decide per field: add a nullable column, derive it, or drop it. Adding a
nullable column is safe at any time. Moving class membership back onto
`students` to suit the UI is not — that is the part the schema freeze protects.

### 3. The deployed database is behind the code

Found during this review: the Supabase project **`School_management`**
(`jiyfmnwtomtmjnubdkcf`, ap-southeast-2 — not `Assessment_Tool`) is at
migration **0003**. `schema_migrations` has three rows, and the eight SIS tables
from `0004_sis_core.sql` do not exist there.

So LS-27 is committed but was never applied to the shared project, and the SIS
and setup APIs have nothing to talk to. Every L3 ticket depends on fixing it
(LS-163).

Apply it with `npm run migrate`, not through the Supabase SQL editor or an MCP
tool. Applying it out of band leaves `schema_migrations` disagreeing with
reality, and the next `npm run migrate` then tries 0004 again and fails.

## What the design pass already fixed

Recorded as LS-176, delivered before the merge. Do not redo any of it, and build
new screens on top of it rather than hand-rolling chrome.

**Two real defects.** `ReadOnlyGuard` let actions worded "cancel", "void",
"waive", "refund", "suspend" or "override" through for roles that could not
perform them. The data-migration wizard could commit to production without ever
running the dry run — it is now gated, and editing the file, entity or mapping
invalidates a passed run.

**Dialog primitives.** `useDialogBehavior`, `DialogShell` and `DialogClose` in
`web/src/components/common/ui.tsx` give Escape-to-close, focus into the panel, a
real focus trap and focus restore. 53 hand-rolled modals across 30 admin screens
were converted onto them; none had handled Escape or labelled its close button.
`web/apps/shared/mobileUi.tsx` has the same behaviour locally for bottom sheets —
the mobile apps deliberately do not import from the console.

**Accessibility.** Toasts announce through a live region. Attendance status in
the mobile apps had been colour-only with the label on hover, unreachable on
touch; calendar cells are now buttons carrying a status letter and a full
accessible name.

**Shared state.** Console overlays are mutually exclusive. The teacher app had
no theming at all and now shares the parent app's. One chat component and one
attendance status map replaced copies that had already drifted apart.

## Things worth knowing before you start

- **The server's 404 is deliberate.** A cross-tenant fetch returns 404, not 403,
  because a 403 would confirm the id is real. The UI must not present that as an
  error state.
- **Login is not an enumeration oracle.** An unknown school, unknown email and
  wrong password return the same body and take the same time. Do not add UI that
  distinguishes them.
- **The ownership filter is the server's job.** `studentScope()` already decides
  whether a caller sees the school or only their own children. Do not
  reimplement it client-side.
- **Never point the server test suite at Supabase.** It TRUNCATEs every
  tenant-scoped table. The harness refuses non-local hosts unless
  `ALLOW_DESTRUCTIVE_TESTS=1`; that flag is for disposable databases only.
- **Most console screens have no failure state.** They were written against
  synchronous mock data, so they never needed one. `LoadingRows` and
  `ErrorState` exist in the design system — use them as screens go live.
- **The web bundle is ~3.1 MB** with no code splitting across 45 screens. Not
  urgent, worth revisiting before the pilot.

## Scope for the pilot

Sprint 2 closes 28 September. L0 to L3 fits; every module does not.

The agreed slice is **school setup, student and staff records, attendance, and
fee *viewing***. Fee collection, receipts, refunds and the payment gateway move
to Sprint 3 — money is where a bug costs the most trust with a pilot school, and
it is not worth a nine-day window. `roadmap.md` already puts pilot UAT in Sprint
5.

One gap worth raising: **DPDP consent (epic LS-7) is in neither active sprint**,
and the pilot will hold real children's data. It should land before the school
goes live, not after.
