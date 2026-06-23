---
name: project-write
description: Use when building or fully refreshing a whole project record in the Ops Hub from a brief or SOW — the user says "write the project record for X", "create the project for [client]", "set up the X project", "project-write X", or hands over a brief/SOW to turn into a project. Composes the whole record and offers to create its tasks; for an incremental top-up of progress, use project-update.
---

# project-write

Composes a **whole** project record from a brief or SOW — new or a full refresh. Sets the properties the config names, composes the configured project body (your SOW scope structure), preserves Manual Notes, stamps the build, and then **offers to create the project's tasks** via `tasks-write`. For an incremental top-up of progress, use `project-update`.

**REQUIRED:** read `${CLAUDE_PLUGIN_ROOT}/_shared/hub-conventions.md` first. Loading the hub, find-by-role, address-by-meaning, confirm-before-write, the stamp, and Notion markdown all live there; this skill assumes them.

## Before you start — apply learned directives

If `memory.md` exists in this skill's folder, read it first and treat each entry as an authoritative override/addition to the steps below. Those entries are improvements approved from past runs.

## Inputs

- **A brief or SOW** — text or a file path; the primary source for the body. If none is given, resolve it from the client's `sources` (SOW/brief files in the client's Admin folder).
- **The client** — name or page; the project must link to one.
- **Project name** — from the brief, or asked.

## Hard rules

- **Confirm before writing** — one body `replace_content` + one `update_properties`; nothing commits until approved.
- **Hard-ask only the Client link.** A project must link to a client. Flag other important gaps (fee, billing type, timeline) but don't block on them.
- **Properties by meaning, only what the brief states** — never touch read-only or formula fields. Don't invent a fee/rate the brief doesn't give.
- **Body = the configured sections, in order** — composed from the brief in the SOW house voice (plain, declarative, British English, no marketing). A section with no source gets a short italic placeholder. Detail: `references/project-body.md`.
- **Manual Notes is sacred** — preserve verbatim on a refresh; seed the default wording on a first build.
- **Tasks never live in the body** — they display through the template's task views. Offer `tasks-write` instead.
- **Stamp on write.**

## Process

1. **Load the hub** (per hub-conventions).
2. **Resolve the project** (by name; new or existing) and the **Client link** — fuzzy-match the client against `clients.title`; hard-ask if it can't be resolved. An existing managed body/stamp means this is a **refresh**: hold its Manual Notes.
3. **Read the brief/SOW** — the primary source. If not supplied, look in the client's Admin folder (`project.sources`).
4. **Set properties** — fill the properties the **hub config** lists for projects (it holds the exact fields + their meanings), by meaning, from what the brief states. Skip read-only/formula. Flag important gaps without blocking.
5. **Compose the body** — each section the **hub config** lists for projects, in order, to its configured purpose, from the brief; carry Manual Notes through (or seed it); prepend the stamp. The default sections follow the SOW structure — composition detail in `references/project-body.md`.
6. **Preview** (confirm-before-write) — changed properties as `label: old → new`, plus the ordered body sections. Offer accept-all or pick.
7. **Commit on approval** — body `replace_content` (stamp included), then `update_properties`.
8. **Offer the tasks** — derive a proposed task list from the Deliverables (plus the standard bracket tasks) and offer to run `tasks-write`, passing it the brief + this project + the client. Don't create tasks here.
9. **Confirm** — link the record; note that progress top-ups run `project-update`.

## What this does NOT do

- Fold progress incrementally (that's `project-update`).
- Create the tasks itself (that's `tasks-write`) — it only proposes and hands off.
- Keep anything task-related in the body (the template's task views handle display).
- Touch Manual Notes, read-only, or formula fields; change schema; or write to any connected service.

## Learning loop (after the deliverable is produced)

Once the work is delivered, reflect silently: did anything this run reveal a concrete, repeatable improvement to how this skill works? Only count generalisable process tweaks, not one-off facts about this specific project or input.

- Found nothing? Say nothing. Do not prompt.
- Found one or more? Offer them: "I noticed N possible improvement(s): [each as a one-line directive]. Save any to memory? (pick which, or none)"

On approval: read `memory.md` (create from the seed if absent), add the directive as a terse imperative bullet with an optional (why: …), consolidate (merge overlaps, drop superseded, keep under ~12), and write it back. Never write without approval. Never edit `SKILL.md` as part of this loop.
