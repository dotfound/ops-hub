---
name: project-update
description: Use when refreshing an existing project's page body in the Ops Hub, e.g. the user says "update project X", "refresh the X project", "reconcile X's task table", "bring X up to date", "/project-update X", or wants a project's task table made current and a progress summary added. Reconciles the Task table from the linked tasks and, when the project is underway, adds Next steps + Work so far drawn from task comments and client emails. Not for creating a project (that is /project-create) or adding tasks (that is /tasks-create); it never rewrites the SOW sections or changes properties.
---

# project-update

Refreshes one existing project's page **body**: reconciles the Task table from the project's linked Tasks, and — when the project is underway — adds a **Next steps** section and a **Work so far** summary just below it. It never rewrites the project's SOW summary sections and never changes its properties.

**Core principle:** the Task table is a live snapshot and the progress sections are a living digest; this skill regenerates them on demand from the linked Tasks, their comments, and the client's emails, while preserving the SOW summary sections verbatim. Like `/client-update`, it recomposes the body and writes only on approval.

## Before you start

Run shared startup first: read and follow `_shared/shared-startup.md` (in the plugin root, alongside `skills/`). It locates the hub, reads Hub Config, introspects the Projects DB (its properties + the Client relation) and the Tasks DB (its **Status options and their colours**, plus the Project relation), reads the `Area = Project Body` section list, and loads this skill's Skill Notes directives. Apply those directives as authoritative overrides.

Then read `_shared/project-body.md` — the shared body spec. Follow its **Task table (shared rendering)** routine and its **create vs update contract**.

## Inputs

- The project to refresh (name or page). It must already exist in the hub; if there's no match, stop and point to `/project-create`.

## Process

1. **Shared startup.** As above. You now hold the live Projects + Tasks schema (Status options with colours, the Project + Client relations) matched to their descriptions, and the `Area = Project Body` section list.
2. **Resolve the project.** Search Projects by name. One match: use it. Several: ask which. None: stop and point to `/project-create`. Note its **Client relation** — needed for the email source.
3. **Read the linked Tasks.** Fetch the project's linked Tasks (Title, Status). Decide whether the project is **in progress**: at least one task whose status is past the hub's first/Backlog option (To Do, In Progress, Blocked, Done all count).
4. **Read the current body.** Fetch the project page. Capture every section **except** the Task table and any existing **Next steps** / **Work so far** sections — that captured block is the SOW summary, spliced back verbatim later.
5. **Render the Task table** from the linked Tasks per `_shared/project-body.md`: columns Task + Status (Assignee optional), a status emoji prefix mapped by Notion **colour**, no Due column, open tasks first and Done last.
6. **Compose the progress sections — only if the project is in progress** (step 3). Otherwise skip them entirely.
   - **Work so far:** a short narrative of what's actually been done, grounded in the tasks' Notion **comments** (`notion-get-comments` per task) and the **client's recent emails** (Gmail connector, searched via the resolved client). Tolerate a missing email connector — fall back to comments alone. Never invent progress.
   - **Next steps:** the near-term actions — the not-started / in-progress tasks and whatever the comments and emails imply comes next.
   - Section order (Next steps vs Work so far) is the user's call: honour a stated order, else default to Next steps first.
7. **Reassemble** the body: rendered Task table → the progress sections (if any) → the SOW summary block spliced back unchanged.
8. **Preview** the proposed body in chat, fenced. State plainly that the SOW summary sections are preserved verbatim and that no properties change. Write nothing yet.
9. **On approval, write** the body (`notion-update-page`, `replace_content`, `allow_deleting_content: true` — project bodies hold no child pages). Revise and re-preview on request; do not write until approved.
10. **Confirm** with the record's URL.

## Hard rules

- **Resolve everything live via shared startup. Never hardcode Notion IDs.**
- **Two things only:** reconcile the Task table, and (when in progress) add/refresh Next steps + Work so far. **Never rewrite the SOW summary sections; never change any project property.**
- **Preserve the SOW summary block verbatim** — every body section other than the Task table and the two progress sections. Never edit, reorder, or drop anything inside it.
- **In-progress gate:** add the progress sections only when at least one task is past the Backlog/first status; a not-started project gets only the Task-table refresh.
- **Render the Task table per the shared routine:** status emoji by Notion colour, no Due column, open tasks first.
- **Preview before any write; write only on explicit approval.**
- **Tolerate per-source failure** — a missing email connector or a task with no comments just yields a thinner summary; never abort the run.
- **Never invent progress.** No signal from comments or emails → a brief, honest Work-so-far (or omit it), not a guess.
- **Existing-record only.** If the project doesn't exist, stop and point to `/project-create`.
- **`<table>` tags, never pipe tables.** Keep section anchors exact (see `_shared/project-body.md`).

## What this does NOT do

- Create a project (that is `/project-create`) or create / refresh tasks (that is `/tasks-create`).
- Rewrite the SOW summary sections (Context … Project team) or change any project property (Fee, Status, Billing Type, …).
- Create or modify schema, or touch the Clients / Pipeline DBs.
- Add the progress sections to a project that hasn't started (all tasks at Backlog) — it refreshes only the Task table then.
- Scan Gmail / Drive for general context. Its only external read is the narrow one for Work so far: the linked tasks' comments and the client's emails.

## Learning loop (after the body is refreshed)

Reflect silently: did anything this run reveal a repeatable improvement to how this skill works (a better default, a summary that composed poorly, a missing check)? Count only generalisable process tweaks, not facts about this one project.

- Found nothing? Say nothing.
- Found one or more? Offer: "I noticed N possible improvement(s): [each as a one-line directive]. Save any to the hub's Skill Notes? (pick which, or none)."

On approval, write each as a new row in the `🧠 Skill Notes` DB, tagged `project-update` (or `global` if it applies to every skill; add `project-create` too if it's about the shared project body). Never write without approval. Never edit this SKILL.md.
