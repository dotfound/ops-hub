# Ops Hub — shared conventions

The cross-cutting machinery every Ops Hub skill relies on — how a skill learns the hub's shape, finds structural fields by **role**, addresses ordinary fields by **meaning**, confirms before writing, resolves where to enrich, and keeps living records current. Skills **point here** (`${CLAUDE_PLUGIN_ROOT}/_shared/hub-conventions.md`), load it on demand, and carry only the behaviour unique to them — they don't restate it. Fix a convention here once and every skill picks it up next run. The skills: `client-write`, `client-update`, `project-write`, `tasks-create`, `project-update`, `hub-setup`.

---

## The hub at a glance

A team's hub is one **Notion workspace** started from the shared template. It holds four tables plus one config page:

| Table        | Holds                                                                                            | Title (default label) |
| ------------ | ------------------------------------------------------------------------------------------------ | --------------------- |
| **Clients**  | one row per client                                                                               | `🏢 Company Name`     |
| **Projects** | one row per project, linked to a client                                                          | `Project Name`        |
| **Tasks**    | one row per task, linked client, and (sometimes) a project                                       | `Name`                |
| **Pipeline** | one row per prospective deal, linked to a client (if the pipeline row is for an existing client) | `Project Name`        |

**Three sources of truth, in priority order:**

1. **Live Notion schema** — the actual tables, fields, and types, read through the connector. Authoritative for *what fields exist and their types*.
2. **Config page** — one Notion page titled `⚙️ Hub Config`, JSON in a code block. Authoritative for *field meanings, body layouts, and source locations*. Shipped in the template so it duplicates into every team's hub; reshaped only by `hub-setup`. Defaults: [`config.default.json`](config.default.json).
3. **Local cache** — one JSON file at `~/.claude/ops-hub/hub-cache.json`, a **speed copy** of 1 + 2 with structural roles pre-resolved. Never authoritative; a stale cache is a performance issue, never a correctness one.

A skill never hardcodes a Notion ID, a field label, or a Drive path. It resolves structural fields by role, ordinary fields by meaning, and source locations from config — all at run time.

---

## Loading the hub (every skill runs this first)

1. **Apply learned directives.** If `memory.md` exists in the skill's folder, read it and treat each entry as an authoritative override/addition to the steps below.
2. **Load the cache.** Present and its `config.version` matches the live config → use it as-is (a warm run barely touches Notion). Otherwise rebuild:
   a. Read the live schema for the four tables (fields + types + relation targets).
   b. Resolve structural roles by type/target — see *Find structural fields by role*.
   c. Find the config page (search for `⚙️ Hub Config`, cache its ID) and read its JSON.
   d. Assemble and write the cache — see *The cache*.
3. **Proceed** using roles and config meanings — never labels.
4. **Reconcile on miss** — a referenced field renamed away gets re-resolved by meaning — see *Address ordinary fields by meaning*.

---

## Find structural fields by role

A few fields are **structural** — a skill cannot work without them. Teams rename fields freely, so skills must never depend on a label like "Company Name". A field's Notion **type** and a relation's **target** don't change on rename; only the label does — so resolve by those and cache the `role → field` map.

| Role | Resolution rule |
|---|---|
| `clients.title` · `projects.title` · `tasks.title` · `pipeline.title` | that table's one property of type `title` |
| `clients.projectsRelation` | Clients' relation whose target is Projects |
| `clients.tasksRelation` | Clients' relation whose target is Tasks |
| `projects.clientRelation` | Projects' relation whose target is Clients |
| `projects.tasksRelation` | Projects' relation whose target is Tasks |
| `tasks.clientRelation` | Tasks' relation whose target is Clients |
| `tasks.projectRelation` | Tasks' relation whose target is Projects |
| `pipeline.clientRelation` | Pipeline's relation whose target is Clients |

All skill logic references **roles**; the cache maps each to the live field. Rename `🏢 Company Name` → `Client` and the next rebuild re-resolves `clients.title` by type to the same field — nothing depended on the label, so nothing breaks.

**Ambiguity:** if a table has two relations to the same target, the rule is ambiguous — disambiguate by the configured meaning and confirm with the user; never pick arbitrarily.

---

## Address ordinary fields by meaning

Everything not structural is **ordinary**: contacts, company details, invoicing, rates, dates, URLs — *and the selects* (Status, Sector, Billing Type, Lead Source…). The connector is **name-addressed** (read/write by label, not ID), so each ordinary field is addressed by its current label, matched to a stable **meaning key** in the config (e.g. `status` → `📋 Status`). Skill logic references the meaning key; the cache maps it to the live label.

- **Selects:** find the field by meaning and **read its options live** — never hardcode option names (e.g. `project-update` proposing a Status).
- **Reconcile on rename:** a configured label that no longer exists in the live schema was renamed — re-resolve by meaning (the structural roles still anchor the table), confirm the single rename with the user, and update the config page + cache. Never guess silently.
- **No field IDs, anywhere:** Notion's stable IDs are exposed by the connector only for relations and select-options, never as a read/write handle — so storing them buys nothing. Find-by-role + name/meaning + reconcile is the whole mechanism.

---

## The config page

`⚙️ Hub Config` holds one JSON block defining, per record type:

- **`fields`** — `meaning key → { label, purpose }`: what each ordinary property is for.
- **`body`** — an ordered list of body sections, each `{ heading, purpose }`: the heading the skill composes under, the purpose telling it (and the team) what goes there. The last entry is always Manual Notes.
- **`sources`** — where to look when enriching — see *Source resolution*.

Skills **build to it**: fill the listed properties, compose the listed sections in order (each to its purpose), search the named sources first. **Skills never hardcode the field or section list** — they read it from this config each run; any field or section names that appear in a skill's steps are illustrative defaults, not a fixed schema. Changed only by `hub-setup` (plus the single-field reconcile above) — never hand-edited by a skill mid-run.

---

## The cache

`~/.claude/ops-hub/hub-cache.json` — outside any skill folder (hygiene: skills hold the skill, not its runtime state); one file per install. It stores:

- `config.version` + a `fetchedAt` timestamp (staleness check),
- the resolved config-page ID,
- the four table → data-source IDs (resolved once at setup; on a cold rebuild, re-resolved by matching data-source titles to the four record types — confirm with the user if a table was renamed),
- per table: field list + types, the `role → field` map, and the config's meanings + body sections + sources.

Rebuild it when it's missing, when the live `config.version` differs, or when a referenced field misses (reconcile).

---

## Confirm before writing (global rule)

**No skill writes to Notion silently.** Before any write, show exactly what will change and get approval:

- **Properties** — each changed property as `label: old → new` (omit unchanged).
- **Body** — which configured sections will be written or changed (for an update, the sections being folded into; for a full write, the section order).
- **Schema side-effects** (hub-setup only) — a field **drop** also strips that field from every view built on it; most consequentially a **form view**, where the bound question silently disappears (Notion can't keep a question with no backing property, and re-adding the field won't restore it). Name each affected form and whether its question was required. Renames are safe — a form question stays bound to its property across a rename.
- Offer **accept all** or **pick** (drop/edit individual changes before committing).

Commit on approval, preferring the **fewest writes** (one body `replace_content`, one `update_properties`). These limits hold even with approval: never touch read-only or formula fields, or **Manual Notes** (see *Living records*).

---

## Source resolution & per-source tolerance

A record type's `sources` (from config) are resolved at run time: an exact path is used directly; a relative path against the client's folder; natural language interpreted and the named place searched directly (the skill is an agent — it searches the right place, it doesn't scan broadly). Connected services (email, calendar, files, analytics, invoicing) are used as available.

**Check what's actually connected first.** At the start of a run, see which services and MCP servers are genuinely available (email, calendar, files / Drive, invoicing, analytics, Notion). Use whatever is connected; don't assume every entry in the default `sources` list is live. Flag any named source that isn't connected as a gap in the output rather than silently failing over it.

**Lead with Drive and Email.** For both resolving a record and enriching it, the connected Drive folder and mailbox are the primary signal. Use `notion-search` only to find an existing Notion page by name; don't lean on `notion-query-data-sources` to list or scan a table, since it's gated behind Notion Enterprise / Notion AI and returns 400s otherwise. Linked records are still read straight from the resolved page's relations, which needs no table query.

**Tolerate per-source failure.** A dead token, an empty result, a missing file — render that section with an explicit placeholder and continue. A section with no resolvable source is left placeholdered. Never abort the whole run because one source failed.

---

## Notion-flavored markdown (non-obvious, load-bearing)

Page bodies use Notion's flavor of Markdown; the page icon and title are set on the page, not in the body.

- **Tables use `<table>` XML, never pipe tables** (pipe tables render as literal `|` in Notion):
  ```
  <table header-row="true">
  <tr><td>Name</td><td>Role</td><td>Email</td></tr>
  <tr><td>Matt White</td><td>Co-Founder</td><td>[matt@x.co.uk](mailto:matt@x.co.uk)</td></tr>
  </table>
  ```
- **Headings are anchors.** `## ` (H2) sections, `### ` (H3) sub-blocks. Keep heading text exact — including emoji — because the update skills locate sections by heading.
- Bullets `- `; bold `**…**`; italic `*…*`; links `[label](url)`, `[email](mailto:email)`; inline emoji typed directly.
- Don't invent callout / toggle / column syntax. Headings + bullets + tables + paragraphs only.

---

## Living records: the stamp + Manual Notes

The two `-update` skills fold new information into an existing record **without disturbing what's there**, anchored by one stamp line:

- **The stamp** — the first line of the managed body (above the first section), italic: `_Last enriched: YYYY-MM-DD · <skill-name>_`.
- **`*-write`** composes the whole body and writes the stamp (today). **`*-update`** reads it, folds in only activity since that date, then re-stamps today. No stamp → the record was never built by a `-write` skill: run the matching `-write`. Clients and projects share this logic.

**Manual Notes** is the last section of every living-record body (client and project) — human-owned, **never touched by any skill**. Task bodies (the 5-section structure) carry no Manual Notes and no stamp (tasks are create-only). Default wording:
> *Use this section for any notes you want to preserve through future context refreshes. The update skill will never touch anything below this heading.*

To fully recompose a record instead of folding, run the matching `-write` skill (it preserves Manual Notes verbatim and re-stamps).

---

## The learning loop

Every interactive Ops Hub skill follows the skill-building-playbook learning loop: a `memory.md` of approved process directives in the skill's folder, read at the start of each run, offered-to-append at the end only when something generalisable surfaced, never written without approval, never auto-editing `SKILL.md`. Each skill ships the standard header, footer, and seeded `memory.md`.

---

## Hard rules (always true)

- **Confirm before every write;** never silently change a property or body.
- **Never touch** Manual Notes, read-only fields, or formula fields.
- **A field drop is also a form-question deletion** — dropping a field silently removes it from any form view that uses it; `hub-setup` discloses this in the drop preview, and renames keep the question bound.
- **Structural fields by role** (type/target), **ordinary fields by meaning** (name + config) — no hardcoded IDs, labels, or paths.
- **Config is the source of truth** for meanings, body layout, and sources; reshape only via `hub-setup`.
- **The cache is a speed copy** — never authoritative; rebuild when stale.
- **`<table>` tags, never pipe tables;** headings are exact anchors.
- **Stamp on `-write`, fold on `-update`;** no stamp → run `-write`.
- **Tolerate per-source failure** — placeholder the section, don't abort.
