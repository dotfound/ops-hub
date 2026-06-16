# Project page body

The spec for composing a project's Notion page body. Shared by `/project-create` (builds it from a brief) and `/project-update` (refreshes it). Like the client body, the section list comes from Hub Config (`Area = Project Body`); the shipped default is the structure below.

## Structure (default)

**Task table** at the top: the project's linked Tasks and their statuses, kept current by `/project-update`.

Beneath it, a **summary structured on the standard SOW format** (sections 1-8), so a project created from an SOW maps one-to-one:

1. **Context** — why the project exists; the problem being solved.
2. **Scope and deliverables** — what will be delivered; the definition of done.
3. **Approach** — how the work is done (kickoff, build, QA, etc.).
4. **Out of scope** — what is explicitly not included.
5. **Assumptions** — what the plan depends on being true.
6. **Customer dependencies** — what the client must provide (access, details, decisions). **This is the home for the client-side dependencies routed out of `/tasks-create`.**
7. **Timeline** — start, build, QA / sign-off milestones.
8. **Project team** — who is involved on each side.

(Charges / fee live in the project's *properties* — Fee, Billing Type — not the body, though the summary may restate them.)

> Note: the template's Hub Config `Area = Project Body` rows currently ship as a generic "Task table" + "Project summary". They should be updated to the sections above so the skills read them live (a template-finalisation task). Until then, `/project-create` uses this documented default.

## Input and the missing-info rule

`/project-create` builds this from an **explicit, provided brief**: a written briefing, an SOW document, or a doc / file the user points to (including a Drive link the user gives). It does NOT scan Gmail, Drive, or other sources for context. If the brief doesn't supply a section (it isn't in SOW format, or omits one), fill what you can and **ask the user** for the missing pieces rather than inventing them; an unfilled section gets a short placeholder.

## The Task table (shared rendering)

The Task table at the top of the body is a rendered snapshot of the project's linked Tasks. Both `/tasks-create` (after it adds tasks to a project) and `/project-update` render it the same way:

- Read the project's linked Tasks (Title, Status, Due, Assignee).
- Render a `<table>` with columns Task, Status, Due (add Assignee if useful), one row per task, sorted sensibly (open tasks first, Done last).
- Replace the `## Task table` section's content with the rendered table.

`/tasks-create` does this only when the new tasks are linked to a project (project-less tasks have no project table to update). `/project-update` always refreshes it, alongside the status narrative.

## Create vs update (the contract)

- `/project-create` writes the project row (properties) + the full body from the brief.
- `/project-update` refreshes the **Task table** and a short status narrative from the linked Tasks, and refreshes the summary only if asked; it preserves any section the user has flagged as manual. (Mirrors the client create/update split.)

## Notion page-body markdown

Same conventions as the client body: see the "Notion page-body markdown" section of `_shared/client-body.md` (tables as `<table>` tags, `##` / `###` headings as anchors, no callouts/toggles). They apply to any page body.
