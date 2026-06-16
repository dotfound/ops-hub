# Shared startup (run at the top of every skill)

Every ops-hub skill orients itself to the user's live Notion hub before doing its own job. That orientation is identical across all seven skills, so it lives here once and each `SKILL.md` references it ("run shared startup, then ...") instead of repeating it. This is the Tier-3 spine from the plan.

## Why this exists

The hub is shaped openly: the user may rename fields, add their own, or drop ones they don't want, and every duplicated hub has different internal IDs. Skills therefore never assume a fixed schema and never hardcode IDs. They read what is actually there, each run, and match it to plain-English descriptions by name. This file is that read-and-match routine.

## The routine, in order

1. **Locate the hub.**
   - Find the hub's parent page by name (default `Notion Ops Hub`; the user may rename it). Use the Notion `search` tool.
   - One match: use it. None or several: ask the user which page is their hub. Do not guess.
   - From the parent page, list its child databases and identify the six by name/role: Clients, Projects, Pipeline, Tasks, plus the two stores `⚙️ Hub Config` and `🧠 Skill Notes`.
   - Capture the resolved IDs **for this run only**. Never store them between runs (they differ per hub and can change).

2. **Read the semantic store (`⚙️ Hub Config`).**
   - Fetch every row. Each is `(Area, Name, Description)`; Area disambiguates fields that share a name across DBs (e.g. `Status`, `Client`, `Title`).
   - Build a lookup keyed by `(Area, Name)` to its description. This is "what each field and section is for."

3. **Introspect each database live.**
   - For each DB the skill will touch, fetch its current property schema (property names + types) from Notion. This reflects the user's hub as it is right now, including their renames and additions.

4. **Match live fields to descriptions by name** (within each Area). The skill now knows, for every live field, both its type and its purpose.
   - **Anchors that must exist** (may be renamed, not removed): each DB's title property; the Client relation on Projects/Tasks/Pipeline; the Lifetime Value field on Clients (found via its description). If an anchor is genuinely missing, stop and tell the user their hub needs `/hub-configure`.

5. **Undescribed field? Annotate, don't block.**
   - If a live field has no Hub Config description, carry on. Note it, and at a natural point offer: "I found a field I don't have a description for: `<name>`. Suggested description from its name and values: '...'. Save it, or skip for this run?"
   - On save, write a new `(Area, Name, Description)` row to Hub Config so every skill benefits next time. On skip, treat it generically this run and re-flag later. Never invent and silently store a description.

6. **Load learning notes (`🧠 Skill Notes`).**
   - Query Skill Notes for rows tagged with this skill's name OR `global`. Treat each as an authoritative directive for this run (improvements approved in past runs). The matching write-step lives in each skill's footer, not here.

7. **Relation integrity is a safety net, not a step.**
   - Duplication preserves the cross-DB relations (verified in the spike), so skills assume they're intact. If one is found broken or one-way mid-task, surface it and suggest re-running `/hub-configure` (which repairs relations) rather than failing silently. Only `/hub-configure` actively repairs.

## Standing conventions

- **Resolve live, never hardcode.** Re-resolve the hub and its IDs by name every run.
- **Match by name + description, never by column position.**
- **On genuine ambiguity, confirm with the user. Do not guess.**
- **Required anchors may be renamed but not deleted.** Everything else is open.
- **Writing a select/status value:** it must be one of the property's existing options (from introspection). If the source data uses a value that isn't an option (common when migrating from a differently-configured system), map it to the nearest valid option, preserve the original wording in a free-text field or the body, and surface the mapping in the preview. Do not create new options unless the user approves.

## Notion tools this routine uses

(Names are stable; exact parameters are confirmed when each skill is built.)

- `search` — locate the hub parent page by name.
- `fetch` — read a page, database, or data-source schema and its rows.
- `notion-create-pages` — add rows (a new Hub Config description, a new client/task, etc.).
- `notion-update-page` — update a row's properties or page body.
- `notion-update-data-source` — amend schema (add/rename a property). `/hub-configure` only.
- `notion-create-view` — create a saved view. `/hub-configure` only.

## Open design points (settle as we build)

- **Hub name when the user renames the parent page.** Default search is `Notion Ops Hub`. If the user renames it, either `/hub-configure` records the chosen name in a Hub Config "system" row that the search reads, or skills confirm the page with the user once per run. Decide when building `/hub-configure`.
- **Exact Skill Notes query** (tag filter vs fetch-all-then-filter). The template ships frozen tag options; confirm the cheaper path at build time.
