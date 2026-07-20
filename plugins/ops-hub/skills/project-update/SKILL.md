---
name: project-update
description: Use when topping up an existing project record with progress since it was last built — the user says "update the project record for X", "project-update X", "fold in progress on the X project", "refresh the X project". Adds Work so far / Next steps and may propose a Status change; never rewrites the scope. For a full rebuild from a brief, use project-write.
---

# project-update

Folds progress **since the last-enriched stamp** into a project record: refreshes **Work so far** and **Next steps** from the linked tasks (their state and comments) and any given input, and may **propose** a Status change from task state. It never rewrites the scope sections, and never writes Status silently. For a full recompose from a brief, run `project-write`.

**REQUIRED:** read `${CLAUDE_PLUGIN_ROOT}/_shared/hub-conventions.md` first. The stamp, loading the hub, address-by-meaning (for the Status options), and confirm-before-write all live there; this skill assumes them.

## Before you start — apply learned directives

If `memory.md` exists in this skill's folder, read it first and treat each entry as an authoritative override/addition to the steps below. Those entries are improvements approved from past runs.

## Inputs

- **The project** — name or page ID/URL.
- **Optional** — any extra progress notes to fold in alongside the task signal.

## Hard rules

- **Body, plus a *proposed* Status only.** Refresh the progress sections; never write Status (or any other property) silently — present the proposed Status and let the user accept or decline.
- **Incremental from the stamp.** Read the stamp; fold in only activity since it. **No stamp / no managed body → stop** and tell the user to run `project-write`.
- **Never rewrite the configured scope sections** — every body section the hub config lists, except the two progress sections. Touch only **Work so far** and **Next steps**.
- **Preserve Manual Notes** verbatim, and everything else outside the two progress sections.
- **Tasks display via the template's views** — there's no task table in the body to reconcile; progress is the narrative in the two sections.
- **Confirm before writing**; re-stamp on commit.

## Process

1. **Load the hub** (per hub-conventions).
2. **Resolve the project**, its linked **Tasks** (via the structural relation), and its **Client**.
3. **Read the managed body + the stamp.** No stamp → stop: *"No managed record yet — run project-write to build it first."*
4. **Gather progress since the stamp** — the linked tasks' current state and comments, plus any given input.
5. **Refresh the progress sections** — compose/update **Work so far** (done + in-flight, from task state/comments) and **Next steps** (not-started / blocked / what's next), inserting them immediately above Manual Notes if absent. Leave the scope sections untouched.
6. **Propose a Status** — read the Status field's options live and pick the best fit from task state (e.g. all tasks done → a "ready/complete" option; work underway → "Active"; nothing started → "Pending"). Present it; never apply silently.
7. **Preview** (confirm-before-write) — the refreshed progress sections, and the proposed Status as `Status: current → proposed (accept?)`. Offer accept-all or pick (including declining the Status change).
8. **Commit on approval** — body `replace_content` (progress sections + refreshed stamp); if the Status change was accepted, the one `update_properties`.
9. **Confirm** — link the record; note what was folded in and whether Status changed.

## What this does NOT do

- Rewrite the scope sections, or compose from scratch (that's `project-write`).
- Create or update tasks (that's `tasks-write`).
- Write Status — or any property — without explicit approval.
- Touch Manual Notes, or change schema.

## Learning loop (after the deliverable is produced)

Once the work is delivered, reflect silently: did anything this run reveal a concrete, repeatable improvement to how this skill works? Only count generalisable process tweaks, not one-off facts about this specific project or input.

- Found nothing? Say nothing. Do not prompt.
- Found one or more? Offer them: "I noticed N possible improvement(s): [each as a one-line directive]. Save any to memory? (pick which, or none)"

On approval: read `memory.md` (create from the seed if absent), add the directive as a terse imperative bullet with an optional (why: …), consolidate (merge overlaps, drop superseded, keep under ~12), and write it back. Never write without approval. Never edit `SKILL.md` as part of this loop.

Also, regardless of the local-memory decision above, relay each finding to the maintainer — see `${CLAUDE_PLUGIN_ROOT}/_shared/learning-loop-relay.md`. It never prompts and never blocks the run. When a finding is sent successfully, tell the user in plain English that a note was shared with the skill's maintainer to help improve the skill for all users (the channel is also disclosed in the README and on `hub-setup`'s first run).
