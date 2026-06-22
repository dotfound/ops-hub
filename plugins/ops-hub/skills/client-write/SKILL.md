---
name: client-write
description: Use when building or fully refreshing a whole client record in the Ops Hub — the user says "write the client record for X", "build context for X", "set up X as a client", "refresh X's client record", "client-write X", or points at a client whose record is empty or stale and wants it (re)composed. Composes the entire record; for an incremental top-up of just what's new, use client-update.
---

# client-write

Composes a **whole** client record — every configured property and body section — for a new client or a full refresh of an existing one. Reads the client's linked work and connected sources over a 2-year look-back, fills the properties the config names, composes the body headings the config lists, preserves Manual Notes, and stamps the build. For an incremental top-up of just what's changed since the last build, use `client-update`.

**REQUIRED:** read `${CLAUDE_PLUGIN_ROOT}/_shared/hub-conventions.md` first. Loading the hub, find-by-role, address-by-meaning, confirm-before-write, the stamp, and Notion markdown all live there; this skill assumes them.

## Before you start — apply learned directives

If `memory.md` exists in this skill's folder, read it first and treat each entry as an authoritative override/addition to the steps below. Those entries are improvements approved from past runs.

## Inputs

- **Client** — a name (fuzzy-matched against the Clients table) or a client page ID / URL.
- **Look-back** — optional override; default **2 years**.

## Hard rules

- **Confirm before writing** — one body `replace_content` + one `update_properties`; nothing commits until approved.
- **Manual Notes is sacred** — preserve it verbatim on a refresh; seed the default wording on a first build; never write over it.
- **Properties by meaning, only what you can source** — fill the configured fields you can confidently derive (e.g. `main_contact_*` from the starred contact); don't guess judgement fields (Status, Sector, rates) — surface those as gaps instead. Never touch read-only or formula fields (a lifetime-value formula, etc.).
- **Body = the configured headings, in order** — compose exactly what `config.body` lists. A section with no resolvable source gets a short italic placeholder, never invented content.
- **Stamp on write** — prepend the managed body with the stamp (today).
- **Tolerate per-source failure** — a dead source placeholders its section; the run never aborts.

## Process

1. **Load the hub** (per hub-conventions) — schema + roles + config + cache.
2. **Resolve the client.** ID/URL → fetch directly. Name → fuzzy-match against `clients.title` (normalised token-set ratio; strip `ltd/limited/plc/inc`), confirm the single best match in one line. Zero → stop; several → list the top 3 to pick.
3. **Fetch the client page** — current properties + existing managed body. A stamp or managed body means this is a **refresh**: hold the current Manual Notes to preserve.
4. **Gather sources** (in parallel, tolerate per-source failure) — resolve the client's `sources` from config over the look-back: linked Projects / Tasks / Pipeline (via the structural relations), invoicing, email, calendar, files. What each default section draws on: `references/client-body.md`.
5. **Compose the body** — one section per configured heading, in order, from the gathered sources; `<table>` markdown for tables. Carry Manual Notes through unchanged (or seed it). Prepend the stamp. Detail per section: `references/client-body.md`.
6. **Set properties** — fill the configured fields by meaning that you can confidently source (e.g. `main_contact_*` from the starred Contacts row); leave judgement fields (Status, Sector, rates) for the human and flag them as gaps. Skip read-only/formula fields.
7. **Preview** (confirm-before-write) — changed properties as `label: old → new`, plus the ordered list of body sections being written. Offer accept-all or pick.
8. **Commit on approval** — one body `replace_content` (stamp included), then one `update_properties`.
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
