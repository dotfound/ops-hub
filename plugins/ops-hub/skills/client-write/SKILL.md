---
name: client-write
description: Use when building or fully refreshing a whole client record in the Ops Hub — the user says "write the client record for X", "build context for X", "set up X as a client", "refresh X's client record", "client-write X", or points at a client whose record is empty or stale and wants it (re)composed. Composes the entire record; for an incremental top-up of just what's new, use client-update.
---

# client-write

Composes a **whole** client record — every configured property and body section. **No Clients row yet? It creates one** (after confirming the name) and seeds Manual Notes with the default wording. **A row already there? It fully rewrites** the managed record in place, carrying the existing Manual Notes through untouched. Either way it reads the client's linked work and connected sources over a 2-year look-back, fills the properties the config names, composes the body headings the config lists, and stamps the build. For an incremental top-up of just what's changed since the last build, use `client-update`.

**REQUIRED:** read `${CLAUDE_PLUGIN_ROOT}/_shared/hub-conventions.md` first. Loading the hub, find-by-role, address-by-meaning, confirm-before-write, the stamp, and Notion markdown all live there; this skill assumes them.

## Before you start — apply learned directives

If `memory.md` exists in this skill's folder, read it first and treat each entry as an authoritative override/addition to the steps below. Those entries are improvements approved from past runs.

## Inputs

- **Client** — a name (fuzzy-matched against the Clients table) or a client page ID / URL.
- **Look-back** — optional override; default **2 years**.

## Hard rules

- **Confirm before writing** — nothing commits until approved. Existing row: one body `replace_content` + one `update_properties`. New client: one `notion-create-pages` to create the Clients row, then its body + properties.
- **Manual Notes is sacred** — preserve it verbatim on a refresh; seed the default wording on a first build; never write over it.
- **Properties by meaning, only what you can source.** Fill the configured fields you can confidently derive (e.g. `main_contact_*` from the starred contact). Don't silently set judgement fields (Status, Sector, rates): take them from the Drive context note when it states them, or propose `Status` from the config's activity-recency rule for the human to confirm; otherwise surface them as gaps. Never touch read-only or formula fields (a lifetime-value formula, etc.).
- **Body = the configured headings, in order** — compose exactly what `config.body` lists. A section with no resolvable source gets a short italic placeholder, never invented content.
- **Stamp on write** — prepend the managed body with the stamp (today).
- **Tolerate per-source failure** — a dead source placeholders its section; the run never aborts.

## Process

1. **Load the hub** (per hub-conventions) — schema + roles + config + cache.
2. **Resolve the client** (Drive + Email primary, per hub-conventions). ID/URL → fetch directly. Name → find the existing Notion page with `notion-search` (don't scan the table with `notion-query-data-sources`, it's gated), then fuzzy-match against `clients.title` (normalised token-set ratio; strip `ltd/limited/plc/inc`) and confirm the single best match in one line. Several → list the top 3 to pick. **Zero match → this is a new client: confirm the name in one line, then create the Clients row (`notion-create-pages` into the Clients data source) and compose the record from whatever sources exist — Drive, Email, and anything else connected.** Creating the row is a normal, expected outcome here; never refuse it or downgrade to update-only. Stop only if the name is too ambiguous to confirm or the user declines.
3. **Fetch or initialise the client page** — existing row: read current properties + the managed body; a stamp or managed body marks this a **refresh**, so hold the current Manual Notes to preserve. New client: nothing to fetch — it's a first build, so Manual Notes gets seeded with the default wording.
4. **Gather sources** (in parallel, tolerate per-source failure). First check what's actually connected (per hub-conventions) and flag any missing source as a gap. Resolve the client's `sources` from config over the look-back, leading with the Drive folder and mailbox: linked Projects / Tasks / Pipeline (via the structural relations), invoicing, email, calendar, files. Read the Drive context note (e.g. `client-context.md` at the folder root) early: it often states judgement fields (status, sector, rate, lead source), turning gaps into sourced values. What each default section draws on: `references/client-body.md`.
5. **Compose the body** — one section per configured heading, in order, from the gathered sources; `<table>` markdown for tables. Carry Manual Notes through unchanged (or seed it). Prepend the stamp. Detail per section: `references/client-body.md`.
6. **Set properties** by meaning, only what you can confidently source (e.g. `main_contact_*` from the starred Contacts row). For judgement fields (Status, Sector, rates): use a value the Drive context note states (sourced); otherwise propose `Status` from the config's activity-recency rule (Active / Recently Lapsed / Lapsed by last activity) for the human to confirm, and flag the rest as gaps. Skip read-only/formula fields.
7. **Preview** (confirm-before-write) — state up front whether this **creates a new row** or **rewrites the existing one**; show changed properties as `label: old → new` (new row: `label: → value`), plus the ordered list of body sections being written. Offer accept-all or pick.
8. **Commit on approval** — new client: `notion-create-pages` to create the Clients row (title + sourced properties), then write the body. Existing row: one body `replace_content` (stamp included), then one `update_properties`.
9. **Confirm** — link the record; note that future top-ups can run `client-update`.

## What this does NOT do

- Fold incrementally (that's `client-update`) — this always composes the whole record.
- Touch Manual Notes, read-only, or formula fields.
- Change schema (that's `hub-setup`) or any other record type.
- Write to any connected service — enrichment is read-only.

## Learning loop (after the deliverable is produced)

Once the work is delivered, reflect silently: did anything this run reveal a concrete, repeatable improvement to how this skill works? Only count generalisable process tweaks, not one-off facts about this specific client or input.

- Found nothing? Say nothing. Do not prompt.
- Found one or more? Offer them: "I noticed N possible improvement(s): [each as a one-line directive]. Save any to memory? (pick which, or none)"

On approval: read `memory.md` (create from the seed if absent), add the directive as a terse imperative bullet with an optional (why: …), consolidate (merge overlaps, drop superseded, keep under ~12), and write it back. Never write without approval. Never edit `SKILL.md` as part of this loop.

Also, regardless of the local-memory decision above, relay each finding to the maintainer — see `${CLAUDE_PLUGIN_ROOT}/_shared/learning-loop-relay.md`. It never prompts and never blocks the run. When a finding is sent successfully, tell the user in plain English that a note was shared with the skill's maintainer to help improve the skill for all users (the channel is also disclosed in the README and on `hub-setup`'s first run).
