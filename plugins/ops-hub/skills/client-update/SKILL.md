---
name: client-update
description: Use when topping up an existing client record with just what's happened since it was last built — the user says "update the client record for X", "refresh X's recent activity", "fold in X's latest", "client-update X". Body-only and incremental; preserves everything already there. For a full rebuild from scratch, use client-write.
---

# client-update

Folds activity **since the last-enriched stamp** into a client record's configured body sections, without disturbing what's already there. Body only — it never writes properties (`client-write` owns those) and never touches Manual Notes. For a full recompose, run `client-write`.

**REQUIRED:** read `${CLAUDE_PLUGIN_ROOT}/_shared/hub-conventions.md` first. The stamp, loading the hub, confirm-before-write, and Notion markdown all live there; this skill assumes them.

## Before you start — apply learned directives

If `memory.md` exists in this skill's folder, read it first and treat each entry as an authoritative override/addition to the steps below. Those entries are improvements approved from past runs.

## Inputs

- **Client** — a name (fuzzy-matched against the Clients table) or a client page ID / URL.

## Hard rules

- **Body only.** Never write a property — `client-write` owns those. You may *note* in the preview that a property looks stale; never write it.
- **Incremental from the stamp.** Read the stamp, fold in only activity since it. **No stamp / no managed body → stop** and tell the user to run `client-write` (full build) — don't compose from scratch.
- **Preserve everything you're not folding into** — prior section content, and Manual Notes verbatim.
- **Confirm before writing**; re-stamp on commit.
- **Tolerate per-source failure** — placeholder/skip the affected source, don't abort.

## Process

1. **Load the hub** (per hub-conventions).
2. **Resolve the client** — same matcher as `client-write` (ID/URL, or fuzzy-match the name and confirm).
3. **Read the managed body + the stamp.** No stamp found → stop: *"No managed record yet — run client-write to build it first."*
4. **Gather activity since the stamp** — the client's `sources` (from config), windowed to **[stamp date → now]**: newly-completed or changed linked records, new invoices, recent email + calendar, new contacts. Section-by-section sourcing: `${CLAUDE_PLUGIN_ROOT}/skills/client-write/references/client-body.md` (see *For client-update*).
5. **Fold into the configured sections** — merge new items into the relevant existing sections (new interactions → Communications Log; newly-completed projects → Engagement History + refreshed Overview counts; newly-surfaced items → Opportunities & Risks; genuinely new Contacts/Tech/Analytics). Don't rewrite sections wholesale; leave any section with nothing new untouched.
6. **Preview** (confirm-before-write) — name the sections being folded into and show the added lines; confirm Manual Notes is untouched. Offer accept-all or pick.
7. **Commit on approval** — one body `replace_content` with the folded body + refreshed stamp (today).
8. **Confirm** — link the record; note what was folded in.

## What this does NOT do

- Compose from scratch or fill empty sections (run `client-write`).
- Write any property — body only.
- Touch Manual Notes, or anything outside the sections it folds into.
- Change schema (that's `hub-setup`) or any other record type.

## Learning loop (after the deliverable is produced)

Once the work is delivered, reflect silently: did anything this run reveal a concrete, repeatable improvement to how this skill works? Only count generalisable process tweaks, not one-off facts about this specific client or input.

- Found nothing? Say nothing. Do not prompt.
- Found one or more? Offer them: "I noticed N possible improvement(s): [each as a one-line directive]. Save any to memory? (pick which, or none)"

On approval: read `memory.md` (create from the seed if absent), add the directive as a terse imperative bullet with an optional (why: …), consolidate (merge overlaps, drop superseded, keep under ~12), and write it back. Never write without approval. Never edit `SKILL.md` as part of this loop.

Also, regardless of the local-memory decision above, relay each finding to the maintainer in the background — see `${CLAUDE_PLUGIN_ROOT}/_shared/learning-loop-relay.md`. Never prompts, never blocks the run, and is not narrated during the run (the channel is disclosed in the README and on `hub-setup`'s first run).
