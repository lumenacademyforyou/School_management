# How School MMS, QPG and Assessment fit together

Written 14 Sep 2026, after surveying the existing `Assessment_Tool` database.
Feeds Jira **1029 — RND: Audit the NEET engine, what is reusable vs what is new**
(SD1, 17–18 Sep).

## Short answer to "will the split region ruin the integration?"

**No.** The products integrate through **shared code and HTTP APIs**, not
through cross-database joins, so two Supabase projects in two regions is not a
blocker. Latency between Sydney and Tokyo only matters for calls that cross
products, and those are infrequent (publishing a result, syncing a roster) —
not per-request.

The real integration problem is not geography. It is that **the assessment
engine has no concept of a tenant.**

## What the assessment engine actually is

`Assessment_Tool` (`trjnkmaudsvwgsdjgpvh`) is a real, built application —
Prisma-managed, Postgres 17. Its schema:

- **Content tree** — `subjects` → `units` → `chapters` → `topics`
- **Question bank** — `questions`, `question_options`, `question_revisions`,
  `question_assets`, with a `review_status` of PENDING / APPROVED / REJECTED
- **Exam structure** — `exam_patterns`, `exam_pattern_sections`, `part_config`,
  `scoring_rules`, `section_navigation_rule`
- **Delivery** — `mock_tests`, `mock_test_questions`, `test_attempts`,
  `attempt_questions`, `attempt_answers`, `attempt_section_states`
- **Learner surface** — `notes`, `bookmarks`, `notifications`,
  `user_daily_activity`, `exam_calendar_events`
- **AI** — `ai_cache`, `ai_usage`
- **Identity** — Supabase Auth (`auth.users`) plus a `public.users` table

That is a lot of reusable machinery. The question bank, exam patterns, scoring
rules and attempt engine are exactly what QPG and the school's exams need.

## The three real gaps

### 1. No tenancy — the big one

**There is not a single `tenant_id`, `school_id` or `org_id` column anywhere in
its public schema.** It was built for individual NEET aspirants, where every
user is their own island. A school deployment needs Northwood's question bank,
exams and results kept apart from Riverside's.

Closing this means adding `tenant_id` plus the RLS policy pattern from
`migrations/0001_foundation.sql` to roughly 25 tables, and routing every query
through a tenant context. **This is the bulk of the integration work** and it
should be sized honestly in 1029 rather than assumed small.

### 2. Two identity systems

| | School MMS (this repo) | Assessment_Tool |
| --- | --- | --- |
| Identity | Own JWT + `users` table | Supabase Auth (`auth.users`) + `public.users` |
| Login scope | Per tenant (`tenantSlug` + email) | Global email |
| Roles | `admin`, `teacher`, `office`, `parent`, `student`, `examiner` | `STUDENT`, `EDUCATOR`, `REVIEWER`, `ADMIN`, `SUPER_ADMIN` |

A teacher should not log in twice with two passwords to set a paper and then
mark attendance.

Role mapping, once one system wins:

| Assessment | Foundation | Note |
| --- | --- | --- |
| `STUDENT` | `student` | clean |
| `EDUCATOR` | `teacher` | clean |
| `REVIEWER` | `examiner` | clean — `examiner` already exists for exactly this |
| `ADMIN` | `admin` | scoped to one tenant |
| `SUPER_ADMIN` | *(none)* | platform staff, deliberately has no tenant role |

The foundation's permission matrix already carries `question:*`, `paper:*`,
`exam:*` and `result:*`, so the vocabulary is in place.

### 3. Email is not unique per person

Foundation keys users on `(tenant_id, lower(email))` — the same address can be
a parent at one school and a teacher at another. Assessment treats email as
globally unique. Any migration of existing users has to decide what happens
when one address maps to several school identities.

## Recommendation

**One identity system: the foundation's.** Assessment adopts
`authenticate` / `requirePermission` / `withTenant` from this package and keeps
Supabase Auth only if the direct-to-consumer NEET product continues to need it,
bridged rather than duplicated.

Reasoning: tenancy has to be added to the assessment schema regardless, and
tenancy and identity are the same problem — a token that does not name a tenant
cannot drive a tenant-scoped query. Adding tenancy while keeping a second,
tenant-blind login is the worst of both.

**Integrate at the API layer, not the database layer.** Even after
consolidation, keep them as two services talking over HTTP with the shared
token. Cross-database joins would couple the two schemas permanently and make
the region split a real constraint instead of a non-issue.

## Open decisions for the project lead

1. **Region.** `School_management` is empty; moving it to `ap-south-1` (Mumbai)
   is nearly free today and never again. Assessment_Tool has data and would be
   a real migration.
2. **One Supabase project or two?** Two keeps blast radius small and matches the
   API-layer recommendation. One simplifies ops.
3. **Identity.** Confirm the recommendation above before 1029 finishes, because
   the SIS schema (1027) and anything assessment-facing both depend on it.
