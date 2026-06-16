---
name: client-update
description: Use when refreshing an existing client's page body in the Ops Hub, e.g. the user says "update client X", "refresh X", "refresh X's context", "/client-update X", or wants a client's living sections brought current. Rebuilds the body from linked data and connected sources while preserving Manual Notes. Not for creating a new client (that is /client-create); it changes fixed properties only with explicit human sign-off.
---

# client-update

Refreshes one existing client's page **body** to the same depth `/client-create` first built it, pulling the living sections current from the linked DBs and connected sources. It preserves the never-overwrite section (Manual Notes) verbatim and changes fixed properties only with explicit, per-field human approval (never automatically).

**Core principle:** the body is the living digest; this skill regenerates it on demand. Same body-composition as `/client-create` (one shared spec), plus Manual Notes preservation. It writes the body freely, but never changes a fixed property without explicit human sign-off.

## Before you start

Run shared startup first: read and follow `_shared/shared-startup.md` (in the plugin root, alongside `skills/`). It locates the hub, reads Hub Config, introspects the Clients DB, and loads this skill's Skill Notes directives. Apply those directives as authoritative overrides.

Then read `_shared/client-body.md` — the shared body-composition spec. It governs the body for both client skills.

## Inputs

- The client to refresh (name or page). It must already exist in the hub; if there's no match, stop and point to `/client-create`.

## Process

1. **Shared startup.** As above. You now hold the live Clients properties matched to their descriptions, and the `Area = Client Body` section list.
2. **Resolve the client.** Search Clients by name. One match: use it. Several: ask which. None: stop and point to `/client-create`.
3. **Read the current body.** Fetch the client page. Identify the never-overwrite section (the `Area = Client Body` row whose description says the refresh never touches it) and capture its content verbatim, to splice back unchanged. If that section is absent from the current body, there is nothing to preserve; seed a fresh empty one.
4. **Recompose the living sections** per `_shared/client-body.md`: gather from the linked DBs and connected sources, and rebuild every *other* `Area = Client Body` section at full depth. Placeholder any section whose source is missing. While gathering, also note any **fixed property** the sources show to be blank-but-now-known or clearly out of date, and collect these as proposed property corrections (never Lifetime Value).
5. **Reassemble** the body: the freshly composed sections in Hub Config order, with the preserved never-overwrite section spliced back into its place, unchanged.
6. **Preview.** Show the proposed new body in chat, fenced. **Separately**, list any proposed property corrections, each as `current -> proposed` with its source. State plainly that the never-overwrite section is preserved verbatim, that every other section is regenerated, and that no property changes without explicit approval. Write nothing yet.
7. **On approval, write.** Write the body (`notion-update-page`, `replace_content`, `allow_deleting_content: true` — client bodies hold no child pages). Apply only the property corrections the user explicitly approved (`update_properties`); approve none and the properties are left untouched. Revise and re-preview on request; do not write until approved.
8. **Confirm** with the record's URL.

## Hard rules

- **Resolve everything live via shared startup. Never hardcode Notion IDs.**
- **Never auto-update properties.** The body is written freely; properties change ONLY for the fields the user explicitly approves from the proposed-corrections list. Never propose or write **Lifetime Value** (that is `/client-ltv-sync`).
- **Preserve the never-overwrite section verbatim.** Identify it by its description, not a hardcoded name. Never edit, reorder, or drop anything inside it.
- **Preview before any write; write only on explicit approval.**
- **Tolerate per-source failure** — a missing connector placeholders its section; never abort the whole run.
- **Never invent client facts.** A section with no signal gets a placeholder, not a guess.
- **Existing-record only.** If the client doesn't exist yet, stop and point to `/client-create`.
- **`<table>` tags, never pipe tables.** Keep section anchors exact (see `_shared/client-body.md`).
- **Refuse to write employee-level data into the hub.** The hub holds business contact info only; that data lives in the client's own systems.

## What this does NOT do

- Create a new client record (that is `/client-create`).
- Change any property without explicit approval, or ever change Lifetime Value (that is `/client-ltv-sync`).
- Create or modify schema, or touch the Projects / Tasks / Pipeline DBs.

## Learning loop (after the body is refreshed)

Reflect silently: did anything this run reveal a repeatable improvement to how this skill works (a better default, a section that composed poorly, a missing check)? Count only generalisable process tweaks, not facts about this one client.

- Found nothing? Say nothing.
- Found one or more? Offer: "I noticed N possible improvement(s): [each as a one-line directive]. Save any to the hub's Skill Notes? (pick which, or none)."

On approval, write each as a new row in the `🧠 Skill Notes` DB, tagged `client-update` (or `global` if it applies to every skill; add `client-create` too if it's about the shared client body). Never write without approval. Never edit this SKILL.md.
