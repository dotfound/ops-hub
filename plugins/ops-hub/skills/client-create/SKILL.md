---
name: client-create
description: Use when adding or migrating an existing client into the Ops Hub by hand, e.g. the user says "create client X", "add X to the hub", "migrate X", "/client-create X", or pastes a client's details to set up. First-time creation of a Clients record (row plus seeded page body). Not for refreshing an existing client (that is /client-update), and not for future clients who self-serve via the onboarding form.
---

# client-create

Creates one Clients record in the hub from data the user supplies: the fixed properties plus a seeded page body. Mainly for migrating existing clients; future clients are created by the Notion onboarding form, then fleshed out by `/client-update`.

**Core principle:** create from what the user gives you, preview before writing, and seed (not fully populate) the body. The living sections are `/client-update`'s job; this skill stands the record up.

## Before you start

Run shared startup first: read and follow `_shared/shared-startup.md` (in the plugin root, alongside `skills/`). It locates the hub, reads the Hub Config semantic store, live-introspects the Clients DB, and loads this skill's Skill Notes directives. Apply those directives as authoritative overrides to the steps below.

Then read `_shared/client-body.md` for the body structure and Notion page-body markdown conventions.

## Inputs

- A client name (minimum), and any fixed-property details the user provides (paste, a pointed-to doc, or free prose). Company Name is the only required field.
- This skill works from the supplied data only. It does not pull from Gmail, Drive, the accounting connector, or any other source (that is `/client-update`).

## Process

1. **Shared startup.** As above. You now hold the live Clients properties matched to their Hub Config descriptions, and the `Area = Client Body` section list.
2. **Check for an existing record.** Search Clients by the supplied name. A strong match means the client may already be in the hub: confirm with the user whether to proceed (they may want `/client-update` instead). If the matched record already has a managed body, stop and point to `/client-update`. No match: proceed.
3. **Map the supplied data to live properties** by name + description. Confirm where a value is ambiguous; an input that maps to no known field gets the shared-startup just-in-time annotation (offer to describe + save it). **Never set Lifetime Value** (it is derived by `/client-ltv-sync`). Ask for any missing details the user wants to include now, but don't force it; unsupplied fields are left blank for the form or a later edit.
4. **Compose the seeded body** per `_shared/client-body.md`: write every `Area = Client Body` section as an H2 in Hub Config order. Fill what the supplied data gives you (typically Contacts and Engagement Overview); scaffold the rest with the placeholder line; always include the never-overwrite section. Lifetime Value in Engagement Overview shows as not-yet-synced.
5. **Preview.** Show the proposed properties and the full body markdown in chat, fenced. List what will be written and where. Write nothing yet.
6. **On approval, write.** Create the Clients row (`notion-create-pages` into the Clients data source) with the mapped properties, then write the body (`notion-update-page`). If the user asks for changes, revise and re-preview; do not write until they approve.
7. **Confirm** with the new record's URL.

## Hard rules

- **Resolve everything live via shared startup. Never hardcode Notion IDs.**
- **Preview before any write; write only on explicit approval.**
- **Never set Lifetime Value** — it is derived by `/client-ltv-sync`.
- **Never invent client facts.** A section you can't fill gets a placeholder, not a guess.
- **First-create only.** If the client already has a managed body, stop and point to `/client-update`.
- **`<table>` tags, never pipe tables.** Keep section anchors exact (see `_shared/client-body.md`).
- **Refuse to write employee-level data into the hub.** The hub holds business contact info only; that data lives in the client's own systems.

## What this does NOT do

- Refresh an existing client's body (that is `/client-update`).
- Pull from Gmail, Drive, the accounting connector, or other sources (that is `/client-update`).
- Create or modify schema, or touch the Projects / Tasks / Pipeline DBs.
- Set or compute Lifetime Value.

## Learning loop (after the record is written)

Reflect silently: did anything this run reveal a repeatable improvement to how this skill works (a better default, a field mapping that tripped, a missing check)? Count only generalisable process tweaks, not facts about this one client.

- Found nothing? Say nothing.
- Found one or more? Offer: "I noticed N possible improvement(s): [each as a one-line directive]. Save any to the hub's Skill Notes? (pick which, or none)."

On approval, write each as a new row in the `🧠 Skill Notes` DB, tagged `client-create` (or `global` if it applies to every skill; add `client-update` too if it's about the client body, which both skills share). Never write without approval. Never edit this SKILL.md.
