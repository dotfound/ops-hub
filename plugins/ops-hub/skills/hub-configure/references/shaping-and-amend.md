# The shaping interview and the amend

How `/hub-configure` walks the user through reshaping the default schema, and how it applies the resulting deltas. Used by **first setup** (steps 5–6, the full per-DB walk) and by **reshape** (a targeted version: one field or section, same amend machinery).

## The shaping interview

The hub arrives as the duplicated default; the user reshapes it to their own. Never start from blank.

### Presentation: recommend-and-adjust, per DB

Walk one DB at a time, in order: **Clients → Projects → Tasks → Pipeline → client body sections → project body sections.**

For each DB, present it as a plain **"Field — what it's for"** list, the descriptions taken from the Hub Config rows for that Area (never raw Notion schema, never property types). Then ask **one** question: *"keep this as-is, or change anything?"* Drill into a specific field only when the user wants to change it. Frame the whole thing as a proposal to react to, not a form to fill.

Exclude the `Area = System` rows from the walk entirely — they are internal state, not user fields.

### What the user can shape

- **Rename the DB** (e.g. Projects → "Projects / Sprints"). A rename only; skills resolve DBs by role, so a rename is invisible to them.
- **Rename a field**, **drop a field**, or **add a field**.
- **Body sections** (Client Body, Project Body) the same way: rename, drop, add. These are page-body sections, recorded only as Hub Config rows.

### What the user cannot shape

- **Do not invite adding or deleting whole databases.** The 4 DBs are the backbone every skill resolves against. Shaping is *within* them.
- **Required anchors are rename-only, never droppable:** each DB's title property and the Client relation on Projects / Tasks / Pipeline. If the user asks to drop one, refuse and offer a rename instead, explaining the skills depend on it.

## The amend: batch → preview → write

Collect **every** delta across the whole interview first. Then show **one** preview of everything. Write only on explicit approval. No delta is written mid-interview (this is what makes bailing safe: nothing half-applied, no half-mutated schema).

### How each delta propagates

A delta lands in different places depending on what it is:

| Delta | Where it is written |
|---|---|
| **Rename a DB field** | schema (`notion-update-data-source`, rename the property) **and** the matching Hub Config row's Name |
| **Add a DB field** | schema (create the property with a type, see below) **and** a new `(Area, Name, Description)` Hub Config row |
| **Drop a DB field** | schema (remove the property) **and** prune the matching Hub Config row |
| **Rename a DB** | schema (the DB title) **and** the Area label on any Hub Config rows for that DB |
| **Rename / drop / add a body section** | **Hub Config row only** (body sections are page content, not Notion properties) |
| **Edit a description** | Hub Config row only |

The rule of thumb: **DB field change = schema + Hub Config; body-section change = Hub Config only.**

### New fields: type and description

- **Infer the type and confirm it** with the user (text, select, number, date, relation, etc.) before creating. Don't assume.
- **Suggest a description** from the field's name (and, for a select, its values); write the confirmed description to the new Hub Config row.
- **Select / status options:** create the options the user names.
- **Formula fields can't be set via the API.** Create the field as far as possible, but **flag the formula expression for a manual paste** in the Notion UI — never claim a formula was applied. (The same limit the template build hit.)

### Preview contents

The single preview shows, grouped clearly:
- Schema changes (renames, adds with their types, drops) per DB.
- Hub Config row changes (new / renamed / pruned descriptions, body-section changes).
- Any relation repair from the integrity check.
- Anything flagged for manual follow-up (formula expressions, the form toggle's visual confirm).

## Reshape (the targeted version)

A reshape re-run skips the full per-DB walk. Ask **"what would you like to change?"**, resolve the named field or section against the live schema + Hub Config, form the delta, and run the **same** batch → preview → write amend above. Update the matching Hub Config row in step. The `setup-complete` marker stays; the hub is already configured. Offer the full per-DB tour only if the user wants it.
