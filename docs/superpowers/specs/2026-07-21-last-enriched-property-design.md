# Ops Hub: move the "last enriched" stamp from the body into a Notion property

**Status:** approved design, pending implementation plan
**Date:** 2026-07-21
**Affects:** `ops-hub` plugin: `_shared/config.default.json`, `_shared/hub-conventions.md`, `skills/client-write`, `skills/client-update`, `skills/project-write`, `skills/project-update`, `skills/hub-setup`, `skills/hub-setup/references/paste-in-format.md`; plus the two live Notion hubs (`[TEMPLATE]` and the working hub).

## Problem

Every living record (Client, Project) carries a "last enriched" marker so the `-update` skills know what has happened since the record was last built. Today that marker is a **body line**: the first line of the managed body, italic, `_Last enriched: YYYY-MM-DD · <skill-name>_`. Because it lives in the page body, it is invisible from the table view: you cannot sort or scan the Clients / Projects tables to see which records are going stale.

The goal is to surface it as a **sortable, visible Notion column** on Clients and Projects, so staleness can be eyeballed and sorted directly in Notion.

## Decisions (locked)

1. **Date only.** The new column is a Notion **Date** property. The current body stamp also records which skill last ran (`· client-write`); that detail is dropped. A Date property is the whole point (sortable / filterable), and the skill name is minor trivia.
2. **A real, ordinary Notion field.** No new "system field" class is introduced. It is an ordinary date field, resolved by meaning like every other field, with one narrow exception below.
3. **The stamp is written silently, without approval.** The plugin's global "confirm before every write" rule is carved out for this one field: the enrichment skills write it automatically as part of the commit and never surface it in the change preview. This preserves how the body stamp behaves today (it self-updates; you never approve it).

## Design

### The field

Add to `config.default.json`, under both `client.fields` and `project.fields`:

```json
"last_enriched": {
  "label": "📅 Last Enriched",
  "type": "date",
  "purpose": "When the record was last enriched by a write/update skill. Written automatically by the skill; read by the update skill to window 'what's new since'. Not hand-edited."
}
```

### The stamp pointer

Replace the current body-oriented `stamp` block:

```json
"stamp": {
  "format": "_Last enriched: {date} · {skill}_",
  "position": "first line of the managed body, above the first section"
}
```

with a pointer to the field that carries the stamp:

```json
"stamp": {
  "field": "last_enriched",
  "dateFormat": "YYYY-MM-DD"
}
```

`config.stamp.field` is the single source of truth for "which field is the enrichment stamp." Everything special about the field derives from this pointer; there is no per-field flag.

### The one exception, stated once

In `hub-conventions.md`, the confirm-before-write rule gains one sentence: **the field named by `config.stamp.field` is written automatically on commit and is never shown in the change preview.** That is the entire behavioural change to the write rule. Every other property still follows "show `old → new`, get approval."

### Reading (the update skills)

`client-update` and `project-update` currently read the body stamp to window their search to `[stamp date → now]`. They instead:

1. Read the `last_enriched` property (resolved by meaning via `config.stamp.field`).
2. If it has a value, use it as the window start.
3. **Transition fallback:** if the property is empty **but** the legacy body stamp line is present, parse the date from that line this one time (so existing records self-migrate).
4. If neither is present, stop and tell the user to run the matching `-write` (unchanged behaviour: "no stamp → never built").

### Writing (all four skills)

- `client-write` / `project-write`: on commit, set `last_enriched` to today. Stop composing the legacy body stamp line.
- `client-update` / `project-update`: on commit, set `last_enriched` to today, and if a legacy body stamp line is still present in the managed body, remove it (part of the same body `replace_content`).
- All four write the stamp **silently** (per the exception above), so it never appears in the preview.

This is a genuine contract change for `client-update`, which today writes **zero** properties ("body only"). Its rule becomes: **body only, plus the automatic enrichment stamp.** Its one commit gains a small `update_properties` for the stamp (or the stamp rides along with any existing property write). `project-update` already issues an `update_properties` for a Status change, so the stamp rides with it (or issues its own when Status is unchanged).

### hub-setup and the setup contract

- `hub-setup` ensures `last_enriched` exists on Clients and Projects on every setup: it is a normal **ADD** when missing (a `fields` entry whose label matches no live field).
- **Safeguard:** `hub-setup` refuses to **drop** or **retype** the field named by `config.stamp.field`, the same way it already refuses to drop read-only / formula fields. Dropping it would silently break the update mechanism, so it is protected at apply-time even though it is otherwise an ordinary field. This is one entry added to the existing "never drop" guard, not a new concept.
- `paste-in-format.md`: note that the stamp field (identified by `config.stamp.field`) is excluded from the droppable / retypable set, alongside structural and formula fields.

### Notion changes (aspect two, data not code)

Add a `📅 Last Enriched` **Date** property to the **Clients** and **Projects** databases in:

1. The shared `[TEMPLATE] Notion Operations Hub` (so every future duplicate inherits it).
2. The working hub (the live one in use today).

Surface the property in each table's default view so it is visible and sortable. Existing rows have an empty value until their next enrich, at which point the transition fallback stamps them.

## Out of scope

- **The setup web app.** It is a separate surface (different repo) and starts from `config.default.json`. Because the field is ordinary, the app will simply carry it through from the updated defaults; teaching the app anything about the stamp is deferred. The drop-safeguard lives in `hub-setup` at apply-time, which is sufficient.
- **Bulk backfill of existing records.** Not needed: records self-migrate on next enrich via the transition fallback.
- **The `task` and `pipeline` record types.** They carry no stamp today and are unchanged.

## Verification

- Fresh hub via `hub-setup`: Clients and Projects each gain a `📅 Last Enriched` Date column.
- `client-write` / `project-write` on a record: the column is set to today; no stamp line appears in the body; the stamp is not shown in the confirm preview.
- `client-update` / `project-update` on a record that still has a legacy body stamp: the window is taken from the old line, the column is set to today, and the legacy body line is removed.
- `client-update` / `project-update` on a record with a populated column and no body line: the window is taken from the column.
- Sorting the Clients table by `📅 Last Enriched` ascending surfaces the stalest records first.
- `hub-setup` output that would drop `last_enriched`: the drop is refused and setup continues.
