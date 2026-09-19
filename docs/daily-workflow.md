# Daily workflow

How a day of work on this repo runs.

## 1. Pick the day's tasks

From the Jira export, take the rows where **Assignee = SD1** and **Start date =
today**. Epics that span months are containers, not work items — skip them and
take the Stories and Tasks underneath.

## 2. Start from current `CSK-branch`

```bash
git checkout CSK-branch
git pull origin CSK-branch
npm install          # only when package.json changed
```

Never stack new work on a branch whose PR has already merged — start fresh from
`CSK-branch`.

## 3. Build it

Follow the three rules in `CLAUDE.md`. In particular: if the task adds a table
that belongs to a school, it needs `tenant_id`, the RLS policy from
`migrations/0001_foundation.sql`, composite `(tenant_id, id)` foreign keys to
other school tables, and every query wrapped in `withTenant()`.
`assertRlsEnforced()` will refuse to start the server if a `tenant_id` table is
missing its policy, so this is checked, not remembered.

## 4. Prove it

```bash
npm run check    # typecheck + lint + test
```

A task is not done because the code exists. Each acceptance criterion should
have a test that would fail if someone removed the behaviour. Security
behaviour especially: write the test that tries to break in.

## 5. Commit and push

```bash
git add -A
git commit      # what changed and why; reference the Jira id
git push -u origin CSK-branch
```

## 6. Update the log

Add the day's entry to `docs/project-log.md`: what was done, what was
deliberately left out and why, and anything the next person would trip over.
The "deliberately left out" part matters most — it is what stops the same
question being re-asked next week.

## Definition of done

The Jira tickets all carry the same one: *reviewed, unit and integration
tested, acceptance criteria met, documentation updated, deployed to staging, QA
signed off, no open P1 or P2 defects.*

One of those cannot be met yet and that is worth saying out loud rather than
quietly ticking: **there is no staging environment**. CI ([1020], JD1) exists
now — GitHub Actions runs typecheck, lint and the test suite (with a
PostgreSQL 17 service) on every push and on pull requests targeting
`CSK-branch`; see `.github/workflows/ci.yml`. Until staging exists, "done"
here means: tested locally, CI green, documented, merged to `CSK-branch`.
