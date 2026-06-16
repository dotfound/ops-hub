---
name: tasks-create
description: Use when turning a provided text into tasks in the Ops Hub, e.g. the user says "create tasks for X", "turn this transcript into tasks", "turn this brief into tasks", "add these to-dos for X", "capture actions from this", "/tasks-create", or pastes a call transcript, a dictated or written brief, or notes and wants the action items captured. Works only from the text the user gives it. Writes Tasks rows linked to the client and its project. Not for creating clients or projects (those are /client-create and /project-create), and not for refreshing existing tasks.
---

# tasks-create

Takes a provided text (a call transcript, a dictated or written brief, or pasted notes) and creates Tasks rows in the hub, each linked to the right client and, where one applies, its project, so the task rolls into that project's task table. The input is deliberately broad about the *kind* of text, but the text is always supplied by the user. Unlike `/client-create` and `/client-update`, this skill does NOT scan Gmail, Drive, or other connected sources to find work; it parses only the text it's given.

**Core principle:** extract the genuinely actionable items from the supplied text, link them correctly, preview, and write only on approval. Capture what's there; never pad the list with invented tasks.

## Before you start

Run shared startup first: read and follow `_shared/shared-startup.md` (in the plugin root, alongside `skills/`). It locates the hub, reads Hub Config, live-introspects the Tasks DB (its Status options, the Client and Project relations, and any Confidentiality / Assignee / Due Date fields), and loads this skill's Skill Notes directives. Apply those directives as authoritative overrides.

## Inputs

- The **text** to work from, supplied by the user: a call transcript, a dictated or written brief, or pasted notes. This skill does not gather from Gmail, Drive, or other sources; it parses only this text.
- The **client** the tasks relate to (named, or inferable from the text). Every task links to a client. Resolving the client by name against the Clients DB is fine; that is hub lookup, not source-scanning.
- Optionally the **project** the tasks belong to. If not given, resolve the client's obvious active project or ask; a task with no project is allowed (a general client task).

## Process

1. **Shared startup.** As above. You now hold the live Tasks schema (Status options, relations, optional fields) matched to their descriptions.
2. **Resolve the client and project.** Search Clients by name (ask if ambiguous; if none, offer `/client-create` or confirm proceeding without). For the project: use the one named, else look at the client's projects and propose the obvious active one, else leave the task project-less.
3. **Extract tasks.** Read the text and pull out the discrete, actionable items. Each becomes a concise, action-first Title plus whatever the text gives (a due date, an owner, a status hint). Merge duplicates; drop non-actions (FYI, chit-chat). Do not invent tasks the text doesn't support.
4. **Map each task** to the live Tasks schema: Title; Status defaults to the hub's first not-started option (introspected, do not assume a literal name); the Client relation; the Project relation when resolved; Due Date if the text gives one; Assignee if named and matchable; the Confidentiality flag if the content is sensitive. A select value that isn't a valid option gets remapped per the shared-startup writing convention.
5. **Preview.** List the proposed tasks (Title, status, project, due, flags) in chat. Write nothing yet.
6. **On approval, create the rows** (`notion-create-pages` into the Tasks data source), setting the Client and Project relations to the resolved pages. Revise and re-preview on request; do not write until approved.
7. **Confirm** with a count and the new rows.

## Hard rules

- **Resolve everything live via shared startup. Never hardcode Notion IDs.**
- **Preview before any write; write only on explicit approval.**
- **Only capture genuinely actionable items from the input. Never invent tasks** to fill the list.
- **Link every task to a client** (and to a project when one applies) so it rolls up correctly.
- **Status defaults to the hub's first not-started option** (introspect; don't assume a literal name).
- **Set Confidentiality when the content is sensitive, and refuse to write employee-level data into the hub.** The hub holds business work items, not employee-level data; that lives in the client's own systems.
- **`<table>` tags, never pipe tables**, in any task body content.

## What this does NOT do

- Create clients or projects (that is `/client-create`, `/project-create`).
- Scan Gmail, Drive, or other connected sources to find tasks. It works only from the provided text (source-gathering is `/client-create` and `/client-update`'s pattern, not this skill's).
- Update or refresh existing tasks (this creates new rows only).
- Refresh the project body or its task table narrative (that is `/project-update`).

## Learning loop (after the tasks are created)

Reflect silently: did anything this run reveal a repeatable improvement to how this skill works (a better extraction heuristic, a default that tripped, a missing check)? Count only generalisable process tweaks, not facts about this one input.

- Found nothing? Say nothing.
- Found one or more? Offer: "I noticed N possible improvement(s): [each as a one-line directive]. Save any to the hub's Skill Notes? (pick which, or none)."

On approval, write each as a new row in the `🧠 Skill Notes` DB, tagged `tasks-create` (or `global` if it applies to every skill). Never write without approval. Never edit this SKILL.md.
