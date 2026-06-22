---
name: tasks-create
description: Use when turning a brief, SOW, meeting transcript, or notes into Task records in the Ops Hub — the user says "create tasks for X", "turn this into tasks", "tasks-create", "make tasks from this transcript/brief", or when project-write offers to create a project's tasks. Everything actionable becomes a task linked to the client (and the project if there is one).
---

# tasks-create

Turns given text — a brief, SOW, meeting transcript, or notes — into Task records, each linked to a **client** (and a **project** if there is one), with the standard 5-section body. **Everything actionable becomes a task**; a thing the *client* owes becomes a **chase/confirm task you own**.

**REQUIRED:** read `${CLAUDE_PLUGIN_ROOT}/_shared/hub-conventions.md` first. Loading the hub, find-by-role, address-by-meaning, and confirm-before-write all live there; this skill assumes them.

## Before you start — apply learned directives

If `memory.md` exists in this skill's folder, read it first and treat each entry as an authoritative override/addition to the steps below. Those entries are improvements approved from past runs.

## Inputs

- **The text** — brief, SOW, meeting transcript, or notes.
- **The client** — name or page; **required** (every task links to a client).
- **The project** — name or page; **optional** (link it when there is one; a client-level task may have none).

When invoked by `project-write`, the text + project + client are passed in.

## Hard rules

- **Everything actionable becomes a task.** A thing the client owes (access, sign-off, content) becomes a **chase/confirm task you own**, not a task assigned to them.
- **Link the client (required); link the project if there is one (optional).** Never invent a project link.
- **Defaults on creation:** status = the backlog-equivalent option (find the Status field by meaning, read its options live); assignee = you; effort and due date **only if the text states them**.
- **Every task gets the body the config lists for tasks** (default 5 sections: User story · Background · Task description · Definition of done · Useful context). Sparse is fine — write "(none — routine X)" rather than inventing.
- **Confirm before writing** — preview the whole task list; create only on approval.
- **Status is always the backlog default on creation** — never anything else.

## Process

1. **Load the hub** (per hub-conventions).
2. **Resolve the client** (required; fuzzy-match) and the **project** (optional). If invoked by `project-write`, both are passed.
3. **Derive the task list** from the text — everything actionable; client-owed items become chase tasks you own; for a project SOW, include the standard bracket tasks and one section's worth per deliverable. See `references/task-derivation.md`.
4. **Compose each task** — name, status = backlog default, assignee = you, effort/due if stated, plus the 5-section body.
5. **Preview** (confirm-before-write) — the task list with names, effort/due, and the client/project links. Offer accept-all or pick.
6. **Create on approval** — one create per task. Halt on first failure; report what was created and what failed.
7. **Confirm** — count created, and link the task view filtered to this project/client.

## What this does NOT do

- Create the client or project records (those are `client-write` / `project-write`).
- Require a project — a client-level task can have none.
- Set Status to anything but the backlog default on creation.
- Update existing tasks (it only creates; re-running would duplicate — delete the old ones first if re-running).
- Compose a project body, or write to any connected service.

## Learning loop (after the deliverable is produced)

Once the work is delivered, reflect silently: did anything this run reveal a concrete, repeatable improvement to how this skill works? Only count generalisable process tweaks, not one-off facts about this specific input.

- Found nothing? Say nothing. Do not prompt.
- Found one or more? Offer them: "I noticed N possible improvement(s): [each as a one-line directive]. Save any to memory? (pick which, or none)"

On approval: read `memory.md` (create from the seed if absent), add the directive as a terse imperative bullet with an optional (why: …), consolidate (merge overlaps, drop superseded, keep under ~12), and write it back. Never write without approval. Never edit `SKILL.md` as part of this loop.
