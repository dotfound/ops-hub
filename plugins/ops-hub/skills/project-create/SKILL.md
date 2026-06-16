---
name: project-create
description: Use when creating a project in the Ops Hub from a brief, e.g. the user says "create a project for X", "set up the X project", "turn this SOW into a project", "/project-create", or provides a written briefing or SOW document for a new project. Reads only the brief you give it. Often run alongside /tasks-create. Not for creating clients (that is /client-create) or refreshing an existing project (that is /project-update).
---

# project-create

Creates one Projects record from an explicit brief: the project's properties plus a body holding a task table and a summary structured on the SOW format (Context, Scope and deliverables, Approach, Out of scope, Assumptions, Customer dependencies, Timeline, Project team). Often run alongside `/tasks-create` from the same brief.

**Core principle:** build the project from the brief you're given (a written briefing, an SOW, or a doc you point to), preview, and write only on approval. Like `/tasks-create`, it parses the provided brief only; it does not scan Gmail, Drive, or other sources.

## Before you start

Run shared startup first: read and follow `_shared/shared-startup.md` (in the plugin root, alongside `skills/`). It locates the hub, reads Hub Config, introspects the Projects DB (its properties + the Client relation) and the `Area = Project Body` section list, and loads this skill's Skill Notes directives. Apply those directives as authoritative overrides.

Then read `_shared/project-body.md` for the body structure and the missing-info rule.

## Inputs

- The **brief**, supplied by the user: a written briefing, an SOW document, or a doc / file the user points to (including a Drive link the user gives). This is the only source; the skill does not scan Gmail or Drive for context.
- The **client** the project belongs to (named, or in the brief). Resolve against the Clients DB.

## Process

1. **Shared startup.** As above.
2. **Resolve the client.** Search Clients by name (ask if ambiguous; if none, offer `/client-create`). The Client relation is required on a project.
3. **Read the brief** the user provided. If it's an SOW, map its sections to the project body's SOW sections (1-8). If it's a looser briefing, extract what maps and note the gaps.
4. **Fill the gaps.** For any required project property or SOW section the brief doesn't supply (Fee, Timeline, Assumptions, etc.), **ask the user** rather than inventing; an unfilled body section gets a short placeholder.
5. **Map the project properties:** Title, Client relation, Status, Type, Fee, Billing Type, from the brief (Fee from the charges section). A select value that isn't a valid option gets remapped per the shared-startup writing convention.
6. **Compose the body** per `_shared/project-body.md`: a Task table at the top (empty at creation), then the SOW-structured summary.
7. **Preview** the proposed properties and body in chat, fenced. Write nothing yet.
8. **On approval, write:** create the Projects row (`notion-create-pages`) with the properties and body. Then **offer to run `/tasks-create`** on the same brief to create the project's tasks.
9. **Confirm** with the new record's URL.

## Hard rules

- **Resolve everything live via shared startup. Never hardcode Notion IDs.**
- **Parse the provided brief only.** Do NOT scan Gmail, Drive, or other connected sources for context (source-gathering is the client skills' pattern). A document the user explicitly points to is part of the brief.
- **Ask for missing info; never invent** scope, fees, dates, or deliverables the brief doesn't support. Unfilled sections get a placeholder.
- **Preview before any write; write only on explicit approval.**
- **The Client relation is required.** A project always links to a client.
- **`<table>` tags, never pipe tables.** Keep section anchors exact (see `_shared/project-body.md`).

## What this does NOT do

- Create a client (that is `/client-create`) or refresh an existing project (that is `/project-update`).
- Create the task rows itself — it offers to hand off to `/tasks-create` for that.
- Scan Gmail, Drive, or other sources for context. It works only from the provided brief.

## Learning loop (after the project is written)

Reflect silently: did anything this run reveal a repeatable improvement to how this skill works (a better default, a brief-mapping that tripped, a missing check)? Count only generalisable process tweaks, not facts about this one project.

- Found nothing? Say nothing.
- Found one or more? Offer: "I noticed N possible improvement(s): [each as a one-line directive]. Save any to the hub's Skill Notes? (pick which, or none)."

On approval, write each as a new row in the `🧠 Skill Notes` DB, tagged `project-create` (or `global` if it applies to every skill; add `project-update` too if it's about the shared project body). Never write without approval. Never edit this SKILL.md.
