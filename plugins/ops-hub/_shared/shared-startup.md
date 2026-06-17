# Shared startup (run at the top of every skill)

Every ops-hub skill orients itself to the user's live Notion hub before doing its own job. That orientation is identical across all seven skills, so it lives here once and each `SKILL.md` references it ("run shared startup, then ...") instead of repeating it. This is the Tier-3 spine from the plan.

## Why this exists

The hub is shaped openly: the user may rename fields, add their own, or drop ones they don't want, and every duplicated hub has different internal IDs. Skills therefore never assume a fixed schema and never hardcode IDs. They read what is actually there, each run, and match it to plain-English descriptions by name. This file is that read-and-match routine.

## The routine, in order

1. **Locate the hub** (layered resolution; never guess).
   - **First, by parent-page name.** Search (`search`) for the hub's parent page by name (default `Notion Ops Hub`; the user may have renamed it). Exactly one match → use it.
   - **Then, by its distinctive stores.** If the name search returns zero or several, search instead for the stores `⚙️ Hub Config` and `🧠 Skill Notes` — distinctive, collision-resistant names — and walk up to their shared parent page. Also try a looser contains-match on the parent name (a hub renamed with a prefix/suffix, e.g. `[TEST] Notion Operations Hub`). Exactly one parent resolving this way → use it.
   - **Otherwise, ask.** If resolution is still zero or ambiguous, ask the user which page is their hub. Never guess.
   - **Confirm before trusting.** However the hub was found, verify the parent page actually contains the expected children (the four DBs + both stores) before proceeding; a page missing them is the wrong page — fall back to asking. (This is also why resolution keys off searchable names, not a stored ID: you must find the hub before you can read anything inside it, so there is no non-circular ID to bootstrap from.)
   - **Refine with the durable anchor.** Once inside, the `(System, Hub Name)` row in `⚙️ Hub Config` (written by `/hub-configure` at setup) is the hub's recorded name. Use it to *confirm* you have the right hub and to disambiguate a noisy name search — but it is a refinement, never the primary locator (the circularity above still holds: find the hub, then read the anchor). `/hub-configure` keeps the stores' distinctive names reserved so this bootstrap stays robust.
   - From the parent page, list its child databases and identify the six by name/role: Clients, Projects, Pipeline, Tasks, plus the two stores `⚙️ Hub Config` and `🧠 Skill Notes`.
   - Capture the resolved IDs **for this run only**. Never store them between runs (they differ per hub and can change).

2. **Read the semantic store (`⚙️ Hub Config`).**
   - **Resolve descriptions by targeted lookup, not a bulk read.** `fetch` on the Hub Config database returns only its *schema*, not its rows, and `search` is semantic + capped (≤25 results, no pagination) — so neither bulk-reads the store (see **Connector read limits** below). Instead: take the authoritative field *list* from live introspection (step 3), and resolve each field's *meaning* on demand by `search`ing the Hub Config data source (`data_source_url`) for that field's name and taking the **normalized-name** match: a leading emoji on a name is decoration, so before comparing, strip a leading emoji and surrounding whitespace from both the field name and each candidate row Name, then match case-insensitively (so `📁 Drive Folder` matches a row named `Drive Folder`). Cache what you resolve for the run. Each row is `(Area, Name, Description)`; Area disambiguates names shared across DBs (e.g. `Status`, `Client`, `Title`). A name with no match after normalizing is undescribed → step 5. (Normalizing rescues a missing emoji, not genuinely different wording: `Drive Folder` still will not match `Drive Folder URL`.)
   - **`Area = System` rows are reserved internal state, not field descriptions.** They are the hub's durable anchor and setup state — `Setup Status`, `Hub Name`, `Sources`, `Setup Date` — written and owned by `/hub-configure`. Read them to learn whether the hub is configured (see below) and to refine resolution, but **exclude them from the field lookup, the shaping walk, and the undescribed-field annotation flow**. They are not user fields; no skill describes, shapes, or annotates them.
   - **The `Setup Status` row is the configured-flag** (tri-state): a value of `setup-complete` means the hub is fully stood up; `in-progress` means `/hub-configure` was interrupted mid-setup; the row being **absent** means the hub has never been configured. Ordinary skills only need: row present and `setup-complete` → proceed normally; otherwise the hub may be unconfigured or half-configured, so if an anchor is also missing, point the user to `/hub-configure`. Acting on the tri-state is `/hub-configure`'s job.
   - Build the field lookup keyed by `(Area, Name)` to its description from the resolved (non-System) rows. This is "what each field and section is for."

3. **Introspect each database live.**
   - For each DB the skill will touch, fetch its current property schema (property names + types) from Notion. This reflects the user's hub as it is right now, including their renames and additions.

4. **Match live fields to descriptions by name** (within each Area). The skill now knows, for every live field, both its type and its purpose.
   - **Anchors that must exist** (may be renamed, not removed): each DB's title property; the Client relation on Projects/Tasks/Pipeline. If an anchor is genuinely missing, stop and tell the user their hub needs `/hub-configure`.

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
- **Orientation is silent; keep the user's view plain.** The locate / read-store / introspect / relation-check routine above is internal plumbing: run it without narrating it to the user. Don't expose internal identifiers or mechanics: page / data-source IDs, `collection://` URIs, schema DDL (`ALTER COLUMN …`), raw schema dumps, or connector-limit detail. Talk about fields by name and purpose. This doesn't gag necessary user-facing content: questions, the shaping proposal, the amend preview, guided manual steps, and errors still appear, just phrased in the user's terms (e.g. "I couldn't find your hub," not a raw ID); a field's type may be named when the user is choosing or confirming it. Surface internals only on an explicit debugging request.
- **Required anchors may be renamed but not deleted.** Everything else is open.
- **Writing a select/status value:** it must be one of the property's existing options (from introspection). If the input uses a value that isn't an option, map it to the nearest valid option, preserve the original wording in a free-text field or the body, and surface the mapping in the preview. Do not create new options unless the user approves.

## Notion tools this routine uses

(Names are stable; exact parameters are confirmed when each skill is built.)

- `search` — locate the hub parent page by name, and resolve Hub Config descriptions by exact-name lookup (semantic; capped at ≤25 results, no pagination).
- `fetch` — read a page's content, or a database / data source's **schema** (it does NOT return a data source's rows).
- `notion-create-pages` — add rows (a new Hub Config description, a new client/task, etc.).
- `notion-update-page` — update a row's properties or page body.
- `notion-update-data-source` — amend schema (add/rename a property). `/hub-configure` only.
- `notion-create-view` — create a saved view. `/hub-configure` only.

## Connector read limits (Notion MCP) — load-bearing

The available Notion connector has **no bulk row-read and no row delete** for data sources. Verified against the live hub (2026-06-17):

- `fetch` on a database/data source returns its **schema only**, never its rows.
- `search` is **semantic and capped at ≤25 results with no pagination**, and a "give me every row of this Area" query returns a relevance-ranked mix, not a clean complete set. **Targeted-name** lookups (search a specific field/section name, take the normalized-name match defined in step 2) are reliable; bulk enumeration is not.
- There is **no `query_data_sources` / list-rows tool**, and **no way to archive or delete a database row** via the connector — only the user can, in the UI.

The skills are built around this:
1. The **field list** is authoritative from live DB introspection (`fetch` on each DB's data source returns the full property schema — reliable).
2. **Descriptions** are resolved per field/section by exact-name `search` against Hub Config, cached per run — never by reading the whole store.
3. **Row removal is a guided manual step** (e.g. a dropped field's orphaned Hub Config row): the skill identifies the rows, asks the user to delete them in the UI, and verifies before continuing.
4. **Body-section lists** (Client Body / Project Body) aren't DB properties, so they can't be introspected, and they can't be enumerated by search either. They live in a single `(System, … Sections)` **index row** that `/hub-configure` writes and maintains — read by one exact-name lookup, with the documented default in the shared body specs (`client-body.md` / `project-body.md`) as the fallback.

If a future connector exposes a list-rows/query or archive tool, the skills can use it directly — nothing depends on its absence beyond these read/delete workarounds.

## Settled design points

- **Durable hub anchor — SETTLED (2026-06-16, building `/hub-configure`).** Resolution (step 1) keys off searchable names — parent title, then the distinctive `⚙️ Hub Config` / `🧠 Skill Notes` stores, then ask — which is robust to a renamed parent and fail-safe, but name-based by necessity (you must find the hub before reading anything in it). `/hub-configure` makes this as stable as possible by reserving the stores' distinctive names and recording the chosen hub name (plus the tri-state setup state) in the `Area = System` rows of `⚙️ Hub Config`. The spine reads `(System, Hub Name)` to *refine* an ambiguous search (step 1) and `(System, Setup Status)` to know the hub is configured (step 2). The anchor refines resolution; it never replaces the name-based bootstrap.

## Open design points (settle as we build)

- **Exact Skill Notes query** (tag filter vs fetch-all-then-filter). The template ships frozen tag options; confirm the cheaper path at build time.
