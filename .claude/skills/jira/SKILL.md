---
name: jira
description: Work with this project's Jira via the Atlassian MCP (Atlassian_Rovo) — search, read, create, update, comment on, transition, or log work against issues, and keep docs/jira/jira-tasks.csv and docs/roadmap.md in sync with what's live in Jira. Use whenever the user mentions Jira, an issue/ticket, a sprint, an epic, or an "LS-" key.
---

# Jira (Atlassian MCP)

This repo's Jira work lives in the **Lumen's space** project, key **`LS`**, on
site `lumenacademyforyou.atlassian.net`. The full backlog is also mirrored at
`docs/jira/jira-tasks.csv` (raw import) and `docs/roadmap.md` (readable
rollup) — those files are a point-in-time export, not the live source of
truth. Jira itself is authoritative; treat the CSV/roadmap as something to
regenerate from Jira, not the other way round.

## Cloud ID

Every Atlassian MCP tool call needs a `cloudId`. Pass the site hostname
directly — it works without an extra lookup:

```
cloudId: lumenacademyforyou.atlassian.net
```

Only fall back to `mcp__Atlassian_Rovo__getAccessibleAtlassianResources` if a
call with the hostname is rejected.

## Common operations

- **Find issues**: `searchJiraIssuesUsingJql` with a JQL string, e.g.
  `project = LS AND status = "To Do" ORDER BY created DESC`.
- **Read one issue**: `getJiraIssue` with `issueIdOrKey` (e.g. `LS-42`).
  Pass `fields: ["*all"]` only when you actually need custom fields —
  the default field set (summary, description, status, type, priority,
  labels, components, assignee, reporter, dates, resolution, project) covers
  most asks. Add `"comment"` to `fields` to pull comments in the same call.
- **Create an issue**: `createJiraIssue` with `cloudId`, `projectKey: "LS"`,
  `issueTypeName` (`Epic`, `Story`, `Bug`, `Task`, `Subtask`), and `summary`.
  Use `additional_fields` for anything else (priority, labels, components,
  fix versions, custom fields) — see the tool description for examples.
- **Update an issue**: `editJiraIssue` with `fields` keyed by field name or
  `customfield_*` ID. Pass an explicit `null` to clear a field (e.g. to clear
  `resolution` before reopening a done issue).
- **Move status**: `getTransitionsForJiraIssue` first to find the valid
  transition IDs for that issue's current state, then
  `transitionJiraIssue` with the chosen `transitionId`. Don't guess IDs —
  they're workflow- and status-specific.
- **Comment**: `addCommentToJiraIssue`. Pass `commentId` to edit an existing
  comment instead of adding a new one.
- **Log work**: `addWorklogToJiraIssue` with `timeSpent` (e.g. `2h`, `1d`).
- **Link issues**: `getIssueLinkTypes` to see valid link types, then
  `createIssueLink`.
- **Projects / issue types / required fields**: `getVisibleJiraProjects`,
  `getJiraProjectIssueTypesMetadata`,
  `getJiraIssueTypeMetaWithFields` (use `requiredFieldsOnly: true` unless you
  need the full field set).

## Team mapping

From `docs/roadmap.md` — use this to set or check `Assignee` when creating or
triaging issues:

| Code | Person | Branch |
| --- | --- | --- |
| SD1 | Santhosh Kumar (senior dev) | `CSK-branch` |
| SD2 | Second senior dev | — |
| JD1 | Junior dev, DevOps and infrastructure | — |
| JD2 | Junior dev, QA and pilot rollout | — |

Use `lookupJiraAccountId` to resolve a person's name/email to the
`accountId` a Jira field actually needs (e.g. `assignee_account_id` on
`createJiraIssue`).

## Working with the CSV / roadmap mirror

- Don't hand-edit `docs/roadmap.md` — it's generated from the CSV (see the
  note at the top of that file). If Jira changes, regenerate the roadmap
  from the CSV, and regenerate the CSV from Jira if the two drift.
- Issue IDs in the CSV (e.g. `1001`) are the original import IDs, not live
  Jira keys — don't assume `docs/jira/jira-tasks.csv` row `1001` is Jira
  issue `LS-1001`. Look the issue up by summary/epic name via
  `searchJiraIssuesUsingJql` (e.g. `project = LS AND summary ~ "Foundation & Shared Platform"`)
  to find its real key before acting on it.
- When asked to "sync" or "check Jira against the CSV", pull the live set
  with `searchJiraIssuesUsingJql` (`project = LS`, paginate as needed) and
  diff summaries/status/assignee against the CSV rather than assuming either
  side is current.

## Guardrails

- Never invent a `cloudId`, `projectKey`, `accountId`, or transition ID —
  look each one up rather than guessing.
- Creating, editing, transitioning, or commenting on a real issue is a
  visible action other people on the Jira project will see. Confirm with the
  user before doing it, the same way you would before pushing code or
  posting to GitHub, unless they've already asked for that specific change.
