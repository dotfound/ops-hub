---
name: client-create
description: Use when adding a client to the Ops Hub by hand, e.g. the user says "create client X", "add X to the hub", "set up X", "/client-create X", or pastes a client's details. First-time creation of a Clients record from scratch: the row plus a full client body. Not for refreshing an existing client (that is /client-update), and not for clients who self-serve via the onboarding form.
---

# client-create

Creates one Clients record in the hub from scratch: the fixed properties, plus a **full client body built to the same depth as `/client-update`**. Builds from what the user provides plus connected sources; it does not assume a prior structured record to copy from. (Future clients can instead get their row from the Notion onboarding form, then `/client-update` builds the body.)

**Core principle:** create the row from supplied data, then compose the full body from the linked DBs and connected sources (per `_shared/client-body.md`), preview everything, and write only on approval. Create and update produce the same body; this skill is create-the-row plus a first full compose.

## Before you start

Run shared startup first: read and follow `_shared/shared-startup.md` (in the plugin root, alongside `skills/`). It locates the hub, reads the Hub Config store, live-introspects the Clients DB, and loads this skill's Skill Notes directives. Apply those directives as authoritative overrides.

Then read `_shared/client-body.md` — the shared body-composition spec (sources, per-section guidance, markdown conventions). It governs the body for both client skills.

## Inputs

- A client name (minimum; Company Name is the only required field) and any fixed-property details the user supplies (typed, pasted, or pointed to).
- The body compose pulls from the linked DBs and whatever sources are connected (accounting, Gmail, Calendar, Drive). It builds the picture from these plus the user's input; it does not assume a pre-existing structured record. Missing sources are placeholdered, not fatal.

## Process

1. **Shared startup.** As above. You now hold the live Clients properties matched to their descriptions, and the `Area = Client Body` section list.
2. **Check for an existing record.** Search Clients by name. A strong match means the client may already exist: confirm whether to proceed (they may want `/client-update`). If the match already has a managed body, stop and point to `/client-update`. No match: proceed.
3. **Set the fixed properties.** Map the user's input (and anything pulled from connected sources) to live properties by name + description. Confirm ambiguous values; an input mapping to no known field gets the shared-startup just-in-time annotation; a select value that isn't a valid option gets remapped per the shared-startup writing convention. **Never set Lifetime Value** (derived by `/client-ltv-sync`), even if a figure is available. Leave unsupplied fields blank.
4. **Compose the full body** per `_shared/client-body.md`: gather from the linked DBs and connected sources, write every `Area = Client Body` section at full depth, placeholder any section whose source is missing, and seed Manual Notes with a prompt line.
5. **Preview.** Show the proposed properties and the full body markdown in chat, fenced, plus a one-line note of which sources were used. Write nothing yet.
6. **On approval, write.** Create the Clients row (`notion-create-pages`) with the properties, then write the body (`notion-update-page`). Revise and re-preview on request; do not write until approved.
7. **Confirm** with the new record's URL.

## Hard rules

- **Resolve everything live via shared startup. Never hardcode Notion IDs.**
- **Preview before any write; write only on explicit approval.**
- **Never set Lifetime Value** — derived by `/client-ltv-sync`.
- **Tolerate per-source failure** — a missing connector placeholders its section; never abort the whole run.
- **Never invent client facts.** A section with no signal gets a placeholder, not a guess.
- **First-create only.** If the client already has a managed body, stop and point to `/client-update`.
- **`<table>` tags, never pipe tables.** Keep section anchors exact (see `_shared/client-body.md`).
- **Refuse to write employee-level data into the hub.** The hub holds business contact info only; that data lives in the client's own systems.

## What this does NOT do

- Refresh an existing client's body (that is `/client-update`).
- Change the fixed properties after creation (only `/client-ltv-sync` touches one, Lifetime Value).
- Create or modify schema, or touch the Projects / Tasks / Pipeline DBs.

## Learning loop (after the record is written)

Reflect silently: did anything this run reveal a repeatable improvement to how this skill works (a better default, a field mapping that tripped, a missing check)? Count only generalisable process tweaks, not facts about this one client.

- Found nothing? Say nothing.
- Found one or more? Offer: "I noticed N possible improvement(s): [each as a one-line directive]. Save any to the hub's Skill Notes? (pick which, or none)."

On approval, write each as a new row in the `🧠 Skill Notes` DB, tagged `client-create` (or `global` if it applies to every skill; add `client-update` too if it's about the client body, which both skills share). Never write without approval. Never edit this SKILL.md.
