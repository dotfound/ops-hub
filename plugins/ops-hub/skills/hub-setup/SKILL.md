---
name: hub-setup
description: Use when a team sets up their Ops Hub for the first time or changes its shape later — the user pastes the Ops Hub setup app's output ("Apply this Ops Hub setup…"), or says "set up my hub", "run hub-setup", "reshape my hub", "rename/add/drop a hub field", "change my hub's body layout or source locations". The only skill that edits hub structure.
---

# hub-setup

Turns a desired hub shape into reality: edits the Notion schema (rename / add / drop fields), rewrites the `⚙️ Hub Config` page (meanings, body layouts, source locations), and refreshes the cache. The **only** skill that changes hub structure — every other skill reads the shape it leaves behind.

**REQUIRED:** read `${CLAUDE_PLUGIN_ROOT}/_shared/hub-conventions.md` first. The hub model, find-by-role, the config page, the cache, and confirm-before-write all live there; this skill assumes them.

## Before you start — apply learned directives

If `memory.md` exists in this skill's folder, read it first and treat each entry as an authoritative override/addition to the steps below. Those entries are improvements approved from past runs.

## Inputs

- **The setup app's output** — a paste-in block beginning "Run the hub-setup skill. Apply this Ops Hub setup", carrying a JSON target shape. The usual path. Format: `references/paste-in-format.md`.
- **Or a described change** in chat ("rename Status to Stage on clients", "add a Region select to clients", "drop Hourly Rate"). Translate it into the same target shape, then proceed identically.

## Hard rules

- **Confirm before writing** — schema DDL *and* the config page. Show the full change plan; nothing is applied until approved.
- **Never drop a field without explicit confirmation.** A drop deletes its data — list drops separately and loudly (`⚠ deletes data`).
- **Structural fields are off-limits to drop or retype.** You may rename a title's or relation's label; never delete it or change its type (a hub needs its titles + relations — see find-by-role). Refuse any such item.
- **Database renames are safe and data-preserving.** A `recordRenames` entry renames the Notion **data-source title** (e.g. Clients to Customers); it never drops or recreates a database. Fields are found by role and the config stores no database names, so a rename can't break relations, forms, or other skills. Cold-rebuild implication: a cold cache rebuild resolves the four tables by matching their data-source titles, so after a rename it keys off the *new* title; the post-apply cache refresh (step 5) stores it, and a teammate's first cold rebuild then matches the new title (hub-conventions tells it to confirm if it detects a rename).
- **Read-only & formula fields are off-limits to drop or retype.** A live formula or read-only field absent from the target is left untouched — never proposed as a drop (the setup app omits them by design).
- **Keep the richer purpose when the app only stripped type hints.** The setup app re-emits each field `purpose` with inline type hints and helper clauses flattened or dropped (e.g. live `(select: Prospect / Active / …)` comes back as `(Prospect / Active / …)`, and a bare `(select)` disappears). When an incoming `purpose` is just the live one with those hints removed and adds no new meaning, keep the live purpose; never propose that downgrade as a config change.
- **A drop also deletes the field's form question.** Before previewing drops, read each affected table's views; if a dropped field backs a question in a `form_editor` view, Notion silently removes that question (and re-adding the field later won't restore it). Disclose it in the preview — name the form and whether the question was `required`. Renames are safe; the question stays bound. (In the shipped template only Clients has a form — its *New client form* — but always read views live, since a team can add a form to any table.)
- **Config and schema move together** — every rename/add/drop is applied to both the Notion schema and the config page in one approved batch, so they never drift.
- **Bump `config.version`** on every config write, so every member's cache rebuilds next run.
- **Every field label starts with an emoji.** When an add or rename yields a label with no leading emoji, prepend a suitable one — reuse the emoji of a same-named field on another table if one exists, else pick one that fits the field's meaning — and show the final label in the preview so the user can override.

## Process

1. **Load the hub** (per hub-conventions). First-run specials:
   - **No hub in the workspace** (the four tables aren't there) → the team hasn't duplicated the template yet. Point them to the setup app's *Step 1*, or to the [TEMPLATE] Notion Operations Hub directly (`https://app.notion.com/p/381e7b4b333d8132ba08d67bafbdaf3d`) — duplicating it (the top-right duplicate icon) copies all four databases + relations in one go. They duplicate, then re-run.
   - No cache → build it. **Resolve the four tables** (Clients/Projects/Tasks/Pipeline) by their data sources; confirm the mapping with the user, then cache table → collection id.
   - No `⚙️ Hub Config` page (older/hand-built hub) → create it from the shipped defaults (`_shared/config.default.json`) before applying changes. A template-started hub already has it — read it.
2. **Parse the target shape** — from the paste-in JSON, or by translating the described change. Result per record type: desired `fields` (labels + meanings + types) and `body`, plus a `renames` list (old label → new) and any `recordRenames` (database-title changes). The paste-in carries no source locations — seed each record's `sources` from `_shared/config.default.json` when first writing the config page; leave them as-is otherwise. See `references/paste-in-format.md`.
3. **Diff against live** — live schema (from step 1) + current config:
   - **rename** = listed in `renames`;
   - **database rename** = listed in `recordRenames` (renames the data-source title; safe — tables found by role);
   - **add** = a target field with no live match after renames;
   - **drop** = a live *ordinary, writable* field absent from the target (never a read-only or formula field);
   - **form-bound drop** = any dropped field that backs a question in a `form_editor` view of its table — read the table's views (the connector exposes them), and capture the form name + whether the question is `required`, so the preview can flag it.
   - **config-only** = changed meanings or body order. A `purpose` that differs only because the app stripped inline type hints / helper clauses is *not* a change: keep the live purpose.
   - **emoji** = any add/rename label with no leading emoji gets a suitable one prepended (carry over the field's existing emoji on a rename; match a same-named field elsewhere; else pick by meaning).
   Never propose dropping or retyping a structural field.
4. **Preview the change plan** (confirm-before-write), grouped per record type:
   - **Database:** `RENAME <old> → <new>` — renames the table's Notion title (safe; relations, forms, and skills find it by role).
   - **Schema:** `RENAME old → new`, `ADD label (type)`, `DROP label ⚠ deletes data` — for a form-bound drop, append `· also deletes the "<question>" question from form "<form>"` (mark `required` ones).
   - **Config:** changed meanings, new body order.
   Offer accept-all or pick.
5. **Apply, on approval:**
   a. **Database renames** — for each `recordRenames` entry, rename the table via the connector by setting the data source's `title` (e.g. `update_data_source` with the new `title`); for a single-source table this also updates the database title the team sees. *Fallback (rare):* if a connector can't, name the rename and ask the user to do it in Notion (one click on the title) — tables are found by role, so nothing depends on the name and order doesn't matter. The cached table→id mapping is unaffected (the id is stable).
   b. **Schema DDL** via the connector — rename, add, drop (`ALTER`/`ADD`/`RENAME`/`DROP` all supported). Halt on first error; report what applied.
   c. **Write the config page** — the new JSON, `version` bumped.
   d. **Refresh the cache** — re-resolve roles + reload config (a field may have moved).
6. **Confirm** — per record type: database renamed (if any), fields renamed/added/dropped, new config version, cache refreshed. Point the user at the likely next step (`client-write` / `project-write`).

## What this does NOT do

- Create the tables or the hub — those come from duplicating the template. hub-setup reshapes what's there.
- Touch any record's body content or properties (that's the write/update skills). It changes *shape*, not data — except a confirmed field drop, which removes that field's data.
- Edit Notion field *descriptions* (the connector can't) — meanings live in the config page.
- Run non-interactively — it always previews and waits for approval.

## Learning loop (after the deliverable is produced)

Once the work is delivered, reflect silently: did anything this run reveal a concrete, repeatable improvement to how this skill works? Only count generalisable process tweaks, not one-off facts about this specific team or input.

- Found nothing? Say nothing. Do not prompt.
- Found one or more? Offer them: "I noticed N possible improvement(s): [each as a one-line directive]. Save any to memory? (pick which, or none)"

On approval: read `memory.md` (create from the seed if absent), add the directive as a terse imperative bullet with an optional (why: …), consolidate (merge overlaps, drop superseded, keep under ~12), and write it back. Never write without approval. Never edit `SKILL.md` as part of this loop.
