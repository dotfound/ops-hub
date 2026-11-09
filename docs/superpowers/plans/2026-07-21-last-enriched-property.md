# Last Enriched Property Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the "last enriched" marker on Client and Project records from a hidden body line to a real, sortable Notion Date column, written automatically by the skills and exempt from the confirm-before-write preview.

**Architecture:** The stamp becomes an ordinary Notion Date field (`📅 Last Enriched`) identified by a single config pointer (`config.stamp.field`). The four living-record skills read it to window "what's new since" and write it silently on commit. One narrow carve-out to the global "confirm before every write" rule covers the silent stamp write; one entry added to hub-setup's "never drop" guard protects the field. Existing records self-migrate: the update skills read the old body line once if the column is empty, then stamp the column and drop the line.

**Tech Stack:** Markdown skill files, one JSON config (`config.default.json`), and the Notion MCP connector (for the two live hubs). No code test harness exists for the skill prose; verification is structural (jq / grep read-back) plus Notion schema read-back.

**Spec:** `docs/superpowers/specs/2026-07-21-last-enriched-property-design.md`

---

## Conventions for this plan

- All plugin paths are relative to `~/code/ops-hub`.
- "Verify" steps read the change back; there is no unit-test runner for skill markdown.
- Edits are shown as an exact **Find** block (current text) and **Replace** block (new text). Match the Find block verbatim, including emoji and punctuation.
- Do not introduce em dashes in any new prose (house preference): use colons, semicolons, commas, or parentheses.

---

### Task 0: Branch

**Files:** none (git only)

- [ ] **Step 1: Create a working branch**

The repo tracks `main`. Branch before editing.

Run:
```bash
cd ~/code/ops-hub && git checkout -b feat/last-enriched-property
```
Expected: `Switched to a new branch 'feat/last-enriched-property'`

---

### Task 1: Config default (`config.default.json`)

**Files:**
- Modify: `plugins/ops-hub/_shared/config.default.json`

- [ ] **Step 1: Repoint the `stamp` block from a body line to the field**

Find:
```json
  "stamp": {
    "format": "_Last enriched: {date} · {skill}_",
    "position": "first line of the managed body, above the first section"
  },
```
Replace:
```json
  "stamp": {
    "field": "last_enriched",
    "dateFormat": "YYYY-MM-DD"
  },
```

- [ ] **Step 2: Add `last_enriched` to `client.fields`**

Find:
```json
        "invoice_instructions": { "label": "💰 Invoice Instructions", "purpose": "PO numbers / references required by the client's invoicing process." }
      },
      "body": [
        { "heading": "👥 Contacts", "purpose": "Who the client's people are: names, roles, emails, with the primary contact starred." },
```
Replace:
```json
        "invoice_instructions": { "label": "💰 Invoice Instructions", "purpose": "PO numbers / references required by the client's invoicing process." },
        "last_enriched": { "label": "📅 Last Enriched", "type": "date", "purpose": "When the record was last enriched by a write/update skill. Written automatically by the skill and never shown in the confirm preview; read by client-update to window what's new since. Not hand-edited." }
      },
      "body": [
        { "heading": "👥 Contacts", "purpose": "Who the client's people are: names, roles, emails, with the primary contact starred." },
```

- [ ] **Step 3: Add `last_enriched` to `project.fields`**

Find:
```json
        "sow_url": { "label": "📄 SOW URL", "purpose": "Link to the signed SOW." }
      },
      "body": [
        { "heading": "🧭 Context", "purpose": "What's prompting the work and the boundary of what this project covers." },
```
Replace:
```json
        "sow_url": { "label": "📄 SOW URL", "purpose": "Link to the signed SOW." },
        "last_enriched": { "label": "📅 Last Enriched", "type": "date", "purpose": "When the record was last enriched by a write/update skill. Written automatically by the skill and never shown in the confirm preview; read by project-update to window progress since. Not hand-edited." }
      },
      "body": [
        { "heading": "🧭 Context", "purpose": "What's prompting the work and the boundary of what this project covers." },
```

- [ ] **Step 4: Verify the JSON parses and the keys exist**

Run:
```bash
cd ~/code/ops-hub && jq -e '.stamp.field == "last_enriched" and (.records.client.fields.last_enriched.type == "date") and (.records.project.fields.last_enriched.type == "date")' plugins/ops-hub/_shared/config.default.json
```
Expected: prints `true` and exits 0. If jq errors, the JSON is malformed: fix the trailing commas.

- [ ] **Step 5: Commit**

```bash
cd ~/code/ops-hub && git add plugins/ops-hub/_shared/config.default.json
git commit -m "feat(config): add Last Enriched date field, repoint stamp to it"
```

---

### Task 2: Shared conventions (`hub-conventions.md`)

**Files:**
- Modify: `plugins/ops-hub/_shared/hub-conventions.md`

- [ ] **Step 1: Add the silent-stamp exception to the confirm-before-write rule**

Find:
```markdown
- Offer **accept all** or **pick** (drop/edit individual changes before committing).

Commit on approval, preferring the **fewest writes** (one body `replace_content`, one `update_properties`). These limits hold even with approval: never touch read-only or formula fields, or **Manual Notes** (see *Living records*).
```
Replace:
```markdown
- Offer **accept all** or **pick** (drop/edit individual changes before committing).

**The enrichment stamp is the one exception.** The field named by `config.stamp.field` (the *Last Enriched* date) is written automatically on commit and is never shown in this preview. It carries no human decision, so approving it every run would be noise. This is the only silent write; every other property still shows `old → new` and waits for approval.

Commit on approval, preferring the **fewest writes** (one body `replace_content`, one `update_properties`). These limits hold even with approval: never touch read-only or formula fields, or **Manual Notes** (see *Living records*).
```

- [ ] **Step 2: Rewrite the stamp definition in "Living records"**

Find:
```markdown
The two `-update` skills fold new information into an existing record **without disturbing what's there**, anchored by one stamp line:

- **The stamp** — the first line of the managed body (above the first section), italic: `_Last enriched: YYYY-MM-DD · <skill-name>_`.
- **`*-write`** composes the whole body and writes the stamp (today). **`*-update`** reads it, folds in only activity since that date, then re-stamps today. No stamp → the record was never built by a `-write` skill: run the matching `-write`. Clients and projects share this logic.
```
Replace:
```markdown
The two `-update` skills fold new information into an existing record **without disturbing what's there**, anchored by one stamp: the **Last Enriched** date property (the field named by `config.stamp.field`, resolved by meaning like any ordinary field).

- **The stamp** — a Notion **Date** property on the record, formatted `config.stamp.dateFormat` (`YYYY-MM-DD`). It shows as a sortable column so staleness is visible in the table. It is written automatically and never appears in the confirm preview (see *Confirm before writing*).
- **`*-write`** composes the whole body and sets the stamp to today. **`*-update`** reads it, folds in only activity since that date, then re-stamps today. Empty stamp (no value on the property) → the record was never built by a `-write` skill: run the matching `-write`. Clients and projects share this logic.
- **Transition (existing records).** A record built before the stamp became a property may still carry a legacy first body line `_Last enriched: YYYY-MM-DD · <skill>_` with the property empty. When the property is empty but that line is present, read the date from the line this once, then on commit set the property and remove the legacy line. Once the property is set, the line is gone and the property is authoritative.
```

- [ ] **Step 3: Update the stamp hard-rule**

Find:
```markdown
- **Stamp on `-write`, fold on `-update`;** no stamp → run `-write`.
```
Replace:
```markdown
- **Stamp on `-write`, fold on `-update`;** the stamp is the *Last Enriched* date property, written silently (never in the preview); empty stamp → run `-write`.
```

- [ ] **Step 4: Verify**

Run:
```bash
cd ~/code/ops-hub && grep -n "config.stamp.field" plugins/ops-hub/_shared/hub-conventions.md && ! grep -n "first line of the managed body, italic" plugins/ops-hub/_shared/hub-conventions.md && echo OK
```
Expected: two grep hits for `config.stamp.field` and a final `OK` (the old italic-body phrasing is gone).

- [ ] **Step 5: Commit**

```bash
cd ~/code/ops-hub && git add plugins/ops-hub/_shared/hub-conventions.md
git commit -m "docs(conventions): stamp is now the Last Enriched property, silent write"
```

---

### Task 3: Write skills (`client-write`, `project-write`)

**Files:**
- Modify: `plugins/ops-hub/skills/client-write/SKILL.md`
- Modify: `plugins/ops-hub/skills/client-write/references/client-body.md`
- Modify: `plugins/ops-hub/skills/project-write/SKILL.md`
- Modify: `plugins/ops-hub/skills/project-write/references/project-body.md`

- [ ] **Step 1: client-write hard rule**

Find:
```markdown
- **Stamp on write** — prepend the managed body with the stamp (today).
```
Replace:
```markdown
- **Stamp on write** — set the *Last Enriched* date property (`config.stamp.field`) to today, silently (it never appears in the preview). Do not add a stamp line to the body.
```

- [ ] **Step 2: client-write process step 5**

Find:
```markdown
5. **Compose the body** — one section per configured heading, in order, from the gathered sources; `<table>` markdown for tables. Carry Manual Notes through unchanged (or seed it). Prepend the stamp. Detail per section: `references/client-body.md`.
```
Replace:
```markdown
5. **Compose the body** — one section per configured heading, in order, from the gathered sources; `<table>` markdown for tables. Carry Manual Notes through unchanged (or seed it). No stamp line in the body (the stamp is now the *Last Enriched* property, set at commit). Detail per section: `references/client-body.md`.
```

- [ ] **Step 3: client-write process step 8**

Find:
```markdown
8. **Commit on approval** — new client: `notion-create-pages` to create the Clients row (title + sourced properties), then write the body. Existing row: one body `replace_content` (stamp included), then one `update_properties`.
```
Replace:
```markdown
8. **Commit on approval** — set the *Last Enriched* property to today as part of the property write (silently, not previewed). New client: `notion-create-pages` to create the Clients row (title + sourced properties incl. *Last Enriched*), then write the body. Existing row: one body `replace_content`, then one `update_properties` (sourced fields + *Last Enriched*).
```

- [ ] **Step 4: client-body.md conventions line**

Find:
```markdown
**Conventions (from hub-conventions):** tables use `<table>` XML, never pipe tables; headings are exact anchors (keep the emoji); the stamp is the first body line; Manual Notes is never composed. Default look-back is **2 years**.
```
Replace:
```markdown
**Conventions (from hub-conventions):** tables use `<table>` XML, never pipe tables; headings are exact anchors (keep the emoji); the stamp is the *Last Enriched* date property (not a body line); Manual Notes is never composed. Default look-back is **2 years**.
```

- [ ] **Step 5: project-write hard rule**

Find:
```markdown
- **Stamp on write.**
```
Replace:
```markdown
- **Stamp on write** — set the *Last Enriched* date property (`config.stamp.field`) to today, silently (never previewed); no stamp line in the body.
```

- [ ] **Step 6: project-write process step 5**

Find:
```markdown
5. **Compose the body** — each section the **hub config** lists for projects, in order, to its configured purpose, from the brief; carry Manual Notes through (or seed it); prepend the stamp. The default sections follow the SOW structure — composition detail in `references/project-body.md`.
```
Replace:
```markdown
5. **Compose the body** — each section the **hub config** lists for projects, in order, to its configured purpose, from the brief; carry Manual Notes through (or seed it); no stamp line in the body (the stamp is the *Last Enriched* property, set at commit). The default sections follow the SOW structure; composition detail in `references/project-body.md`.
```

- [ ] **Step 7: project-write process step 7**

Find:
```markdown
7. **Commit on approval** — body `replace_content` (stamp included), then `update_properties`.
```
Replace:
```markdown
7. **Commit on approval** — body `replace_content`, then `update_properties` (sourced fields + the *Last Enriched* property set to today, the latter silently, not previewed).
```

- [ ] **Step 8: project-body.md conventions line**

Find:
```markdown
**Conventions (from hub-conventions):** `<table>` XML never pipe tables; headings are exact anchors (keep emoji); the stamp is the first body line; Manual Notes is never composed. The body holds **no tasks** — deliverables become Task records via `tasks-write`, shown through the template's task views.
```
Replace:
```markdown
**Conventions (from hub-conventions):** `<table>` XML never pipe tables; headings are exact anchors (keep emoji); the stamp is the *Last Enriched* date property (not a body line); Manual Notes is never composed. The body holds **no tasks**; deliverables become Task records via `tasks-write`, shown through the template's task views.
```

- [ ] **Step 9: Verify no "prepend the stamp" / "first body line" remains in write skills**

Run:
```bash
cd ~/code/ops-hub && ! grep -rn "prepend the stamp\|stamp included\|stamp is the first body line" plugins/ops-hub/skills/client-write plugins/ops-hub/skills/project-write && grep -rn "Last Enriched" plugins/ops-hub/skills/client-write plugins/ops-hub/skills/project-write && echo OK
```
Expected: old phrases gone, `Last Enriched` present in both skills, final `OK`.

- [ ] **Step 10: Commit**

```bash
cd ~/code/ops-hub && git add plugins/ops-hub/skills/client-write plugins/ops-hub/skills/project-write
git commit -m "feat(write-skills): set Last Enriched property instead of body stamp"
```

---

### Task 4: Update skills (`client-update`, `project-update`)

**Files:**
- Modify: `plugins/ops-hub/skills/client-update/SKILL.md`
- Modify: `plugins/ops-hub/skills/client-write/references/client-body.md`
- Modify: `plugins/ops-hub/skills/project-update/SKILL.md`

- [ ] **Step 1: client-update summary line**

Find:
```markdown
Folds activity **since the last-enriched stamp** into a client record's configured body sections, without disturbing what's already there. Body only — it never writes properties (`client-write` owns those) and never touches Manual Notes. For a full recompose, run `client-write`.
```
Replace:
```markdown
Folds activity **since the last-enriched stamp** into a client record's configured body sections, without disturbing what's already there. Body only, plus the automatic *Last Enriched* stamp: it writes no other property (`client-write` owns those) and never touches Manual Notes. For a full recompose, run `client-write`.
```

- [ ] **Step 2: client-update hard rules (body-only + incremental)**

Find:
```markdown
- **Body only.** Never write a property — `client-write` owns those. You may *note* in the preview that a property looks stale; never write it.
- **Incremental from the stamp.** Read the stamp, fold in only activity since it. **No stamp / no managed body → stop** and tell the user to run `client-write` (full build) — don't compose from scratch.
```
Replace:
```markdown
- **Body only, plus the stamp.** The only property you write is the *Last Enriched* date (`config.stamp.field`), set to today at commit, silently (never in the preview). Never write any other property — `client-write` owns those. You may *note* in the preview that another property looks stale; never write it.
- **Incremental from the stamp.** Read the *Last Enriched* property; fold in only activity since it. If it's empty but a legacy `_Last enriched: …_` body line is present, read the date from that line this once. **No stamp (neither property nor legacy line) / no managed body → stop** and tell the user to run `client-write` (full build); don't compose from scratch.
```

- [ ] **Step 3: client-update process step 3**

Find:
```markdown
3. **Read the managed body + the stamp.** No stamp found → stop: *"No managed record yet — run client-write to build it first."*
```
Replace:
```markdown
3. **Read the managed body + the stamp.** Read the *Last Enriched* property; if empty, look for a legacy `_Last enriched: …_` first body line. Neither present → stop: *"No managed record yet — run client-write to build it first."*
```

- [ ] **Step 4: client-update process step 7 (commit)**

Find:
```markdown
7. **Commit on approval** — one body `replace_content` with the folded body + refreshed stamp (today).
```
Replace:
```markdown
7. **Commit on approval** — one body `replace_content` with the folded body (and, if a legacy stamp line was present, with that line removed), plus one `update_properties` setting *Last Enriched* to today (silent; not previewed). If nothing changed in the body, still update the property.
```

- [ ] **Step 5: client-update "What this does NOT do"**

Find:
```markdown
- Write any property — body only.
```
Replace:
```markdown
- Write any property other than the automatic *Last Enriched* stamp.
```

- [ ] **Step 6: client-body.md "For client-update" folding lines**

Find:
```markdown
Fold only activity since the stamp into the sections above, preserving prior content:
```
Replace:
```markdown
Fold only activity since the stamp (the *Last Enriched* property; if it's empty, fall back to a legacy `_Last enriched: …_` body line this once) into the sections above, preserving prior content:
```

Then Find:
```markdown
A section with nothing new is left untouched. Manual Notes is never touched. Re-stamp on commit.
```
Replace:
```markdown
A section with nothing new is left untouched. Manual Notes is never touched. Re-stamp on commit by setting the *Last Enriched* property to today (silently); if a legacy `_Last enriched: …_` body line is present, remove it.
```

- [ ] **Step 7: project-update hard rules (body/status + incremental)**

Find:
```markdown
- **Body, plus a *proposed* Status only.** Refresh the progress sections; never write Status (or any other property) silently — present the proposed Status and let the user accept or decline.
- **Incremental from the stamp.** Read the stamp; fold in only activity since it. **No stamp / no managed body → stop** and tell the user to run `project-write`.
```
Replace:
```markdown
- **Body, a *proposed* Status, and the automatic stamp.** Refresh the progress sections; never write Status (or any other data property) silently: present the proposed Status and let the user accept or decline. The one property written without approval is the *Last Enriched* date (`config.stamp.field`), set to today at commit.
- **Incremental from the stamp.** Read the *Last Enriched* property; fold in only activity since it. If it's empty but a legacy `_Last enriched: …_` body line is present, read the date from that line this once. **No stamp (neither property nor legacy line) / no managed body → stop** and tell the user to run `project-write`.
```

- [ ] **Step 8: project-update process step 3**

Find:
```markdown
3. **Read the managed body + the stamp.** No stamp → stop: *"No managed record yet — run project-write to build it first."*
```
Replace:
```markdown
3. **Read the managed body + the stamp.** Read the *Last Enriched* property; if empty, look for a legacy `_Last enriched: …_` first body line. Neither present → stop: *"No managed record yet — run project-write to build it first."*
```

- [ ] **Step 9: project-update process step 8 (commit)**

Find:
```markdown
8. **Commit on approval** — body `replace_content` (progress sections + refreshed stamp); if the Status change was accepted, the one `update_properties`.
```
Replace:
```markdown
8. **Commit on approval** — body `replace_content` (progress sections; remove a legacy stamp line if present), plus one `update_properties` that sets *Last Enriched* to today (silent) and, if the Status change was accepted, the new Status.
```

- [ ] **Step 10: project-update "What this does NOT do"**

Find:
```markdown
- Write Status — or any property — without explicit approval.
```
Replace:
```markdown
- Write Status, or any property other than the automatic *Last Enriched* stamp, without explicit approval.
```

- [ ] **Step 11: Verify**

Run:
```bash
cd ~/code/ops-hub && grep -rn "Last Enriched" plugins/ops-hub/skills/client-update plugins/ops-hub/skills/project-update && ! grep -rn "Body only\.\*\*.*Never write a property" plugins/ops-hub/skills/client-update/SKILL.md && echo OK
```
Expected: `Last Enriched` present in both update skills, final `OK`.

- [ ] **Step 12: Commit**

```bash
cd ~/code/ops-hub && git add plugins/ops-hub/skills/client-update plugins/ops-hub/skills/project-update plugins/ops-hub/skills/client-write/references/client-body.md
git commit -m "feat(update-skills): read/write Last Enriched property, migrate legacy body stamp"
```

---

### Task 5: hub-setup (protect the stamp field)

**Files:**
- Modify: `plugins/ops-hub/skills/hub-setup/SKILL.md`
- Modify: `plugins/ops-hub/skills/hub-setup/references/paste-in-format.md`

- [ ] **Step 1: Add a hard rule protecting the stamp field**

Find:
```markdown
- **Read-only & formula fields are off-limits to drop or retype.** A live formula or read-only field absent from the target is left untouched — never proposed as a drop (the setup app omits them by design).
```
Replace:
```markdown
- **Read-only & formula fields are off-limits to drop or retype.** A live formula or read-only field absent from the target is left untouched — never proposed as a drop (the setup app omits them by design).
- **The enrichment stamp field is off-limits to drop or retype.** The field named by `config.stamp.field` (the *Last Enriched* date) underpins every `-update`; treat it like a formula field: never propose it as a drop or retype, even if the target shape omits it. It is added when missing (a normal ADD) and renamed safely if relabelled.
```

- [ ] **Step 2: Exclude the stamp field in the diff "drop" rule**

Find:
```markdown
   - **drop** = a live *ordinary, writable* field absent from the target (never a read-only or formula field);
```
Replace:
```markdown
   - **drop** = a live *ordinary, writable* field absent from the target (never a read-only or formula field, and never the `config.stamp.field` stamp);
```

- [ ] **Step 3: Extend the "never propose dropping a structural field" line**

Find:
```markdown
   Never propose dropping or retyping a structural field.
```
Replace:
```markdown
   Never propose dropping or retyping a structural field, or the `config.stamp.field` stamp.
```

- [ ] **Step 4: Note the exclusion in the paste-in contract**

Find:
```markdown
**Structural fields** (titles, relations) never appear as drops or retypes — the app omits them from the editable set. The same goes for **read-only / formula fields** (e.g. a Weighted Value formula). If one shows up anyway, the skill refuses that single item and continues.
```
Replace:
```markdown
**Structural fields** (titles, relations) never appear as drops or retypes — the app omits them from the editable set. The same goes for **read-only / formula fields** (e.g. a Weighted Value formula) and the **enrichment stamp** (the field named by `config.stamp.field`, the *Last Enriched* date), which every `-update` depends on. If one shows up as a drop or retype anyway, the skill refuses that single item and continues.
```

- [ ] **Step 5: Verify**

Run:
```bash
cd ~/code/ops-hub && grep -cn "config.stamp.field" plugins/ops-hub/skills/hub-setup/SKILL.md plugins/ops-hub/skills/hub-setup/references/paste-in-format.md
```
Expected: three hits in SKILL.md, one in paste-in-format.md.

- [ ] **Step 6: Commit**

```bash
cd ~/code/ops-hub && git add plugins/ops-hub/skills/hub-setup
git commit -m "feat(hub-setup): protect the Last Enriched stamp field from drop/retype"
```

---

### Task 6: Apply to the two live Notion hubs

This task uses the **Notion MCP** connector, not the filesystem. It brings the shipped `[TEMPLATE]` hub (source for all future duplicates) and the working hub into line with the new config: a `📅 Last Enriched` Date column on Clients and Projects, plus the matching `⚙️ Hub Config` page JSON.

Do this for **both** hubs. The `[TEMPLATE]` hub page is `https://app.notion.com/p/381e7b4b333d8132ba08d67bafbdaf3d`. Resolve the working hub and all four data sources by search; never hardcode IDs beyond the template page above.

**Because these are production Notion databases, present the plan and get the user's go-ahead before writing (this is a manual mirror of what hub-setup would do).**

- [ ] **Step 1: Resolve the databases**

For each hub, use `notion-search` / `notion-fetch` to locate the **Clients** and **Projects** data sources and the `⚙️ Hub Config` page. Record their IDs for the steps below. Confirm the mapping with the user in one line per hub.

- [ ] **Step 2: Add the `📅 Last Enriched` Date column to Clients and Projects (both hubs)**

For each of the four databases (template Clients, template Projects, working Clients, working Projects), add one property:
- Name: `📅 Last Enriched`
- Type: `date`

Use the connector's data-source schema update (`notion-update-data-source`, adding a `date` property). Leave every existing property untouched. Existing rows get an empty value (they self-migrate on next enrich).

- [ ] **Step 3: Surface the column in the default table view**

Confirm the new property is visible in each table's default/grid view (Notion appends new properties to views by default; if a view hides new properties, unhide `📅 Last Enriched`). The point of the change is that it is visible and sortable.

- [ ] **Step 4: Update each `⚙️ Hub Config` page JSON**

Read each hub's `⚙️ Hub Config` page (JSON in a code block). Apply the same three edits made to `config.default.json` in Task 1:
- add `last_enriched` to `records.client.fields` and `records.project.fields` (label `📅 Last Enriched`, type `date`, the purpose strings from Task 1),
- replace the top-level `stamp` block with `{ "field": "last_enriched", "dateFormat": "YYYY-MM-DD" }`,
- **increment the top-level `version` number** (so every member's local cache rebuilds on next run).

Write the page back with the connector. Do not change any other field, body section, or source.

- [ ] **Step 5: Verify the schema and config on both hubs**

For each hub:
- Re-read the Clients and Projects data-source schema via the connector and confirm a `date` property named `📅 Last Enriched` exists on both.
- Re-read the `⚙️ Hub Config` page and confirm `stamp.field == "last_enriched"`, both `last_enriched` field entries are present, and `version` was bumped.

Report the before/after `version` numbers and the four confirmed columns to the user.

- [ ] **Step 6: (No commit)** This task changes Notion, not the repo. Nothing to commit.

---

### Task 7: Final review and branch wrap-up

**Files:** none (verification + git)

- [ ] **Step 1: Full grep sweep for stale stamp language**

Run:
```bash
cd ~/code/ops-hub && grep -rn "first body line\|prepend the stamp\|stamp included\|{date} · {skill}\|first line of the managed body" plugins/ops-hub
```
Expected: **no output** (every reference to the old body-line stamp is gone). If anything prints, fix it and amend the relevant commit.

- [ ] **Step 2: Confirm the field appears everywhere it should**

Run:
```bash
cd ~/code/ops-hub && grep -rln "Last Enriched\|config.stamp.field" plugins/ops-hub | sort
```
Expected paths include: `_shared/config.default.json`, `_shared/hub-conventions.md`, `skills/client-write/SKILL.md`, `skills/client-write/references/client-body.md`, `skills/project-write/SKILL.md`, `skills/project-write/references/project-body.md`, `skills/client-update/SKILL.md`, `skills/project-update/SKILL.md`, `skills/hub-setup/SKILL.md`, `skills/hub-setup/references/paste-in-format.md`.

- [ ] **Step 3: Review the diff**

Run:
```bash
cd ~/code/ops-hub && git log --oneline main..HEAD && git diff --stat main..HEAD
```
Confirm the commit set matches Tasks 1 to 5 and the touched files match the list above.

- [ ] **Step 4: Hand back to the user**

The change is complete on `feat/last-enriched-property` and applied to both Notion hubs. Ask the user whether to merge to `main` and push (they control merges and pushes), and remind them that pushing plus the marketplace auto-update is what propagates the skill change to their Claude Code install.

---

## Self-review notes (author)

- **Spec coverage:** field added (Task 1, Task 6), stamp pointer (Task 1, 2), silent-write exception (Task 2, 3, 4), read + transition fallback (Task 4), write skills stop stamping the body (Task 3), hub-setup ADD + drop-protection (Task 5, and ADD falls out of the existing "add = target field with no live match" rule once config lists it), Notion columns on both hubs + config-page sync + version bump (Task 6), verification (Task 7). All spec sections map to a task.
- **Out of scope, per spec:** the setup web app (separate repo), bulk backfill (self-migration covers it), task/pipeline records (no stamp).
- **Naming consistency:** `config.stamp.field` and `📅 Last Enriched` used identically across every task; `last_enriched` is the meaning key everywhere.
