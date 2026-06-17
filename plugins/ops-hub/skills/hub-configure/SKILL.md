---
name: hub-configure
description: Use when standing up, connecting to, or reshaping the Ops Hub, e.g. the user says "configure the hub", "set up the ops hub", "stand up the hub", "/hub-configure", "connect this machine to the hub", "I've duplicated the template", "reshape the hub", "rename a field", "add a field to the hub", or a teammate is joining and needs their own machine connected. The setup conductor for the whole plugin. Not for adding clients, projects, or tasks (those are the create skills).
---

# hub-configure

The setup conductor for the Ops Hub. The hub ships as a published Notion template the user duplicates in one click; this skill does everything after that click: locates the duplicated hub, connects the user's sources, walks a shaping interview so the user reshapes the default schema to their own, applies the deltas to both the Notion schema and the Hub Config descriptions, opens the New Client form, clears the demo seed, and writes the durable marker that tells every other skill the hub is ready. Re-runnable forever to evolve the shape or connect a new machine.

**Core principle:** duplicate-then-amend, never build from scratch. The structure arrives correct by duplication; this skill only applies the user's deltas on top, batched and preview-first. It branches on the *state of the shared hub*, never on who or which machine is running it. Everything it writes is reversible-by-re-run: **nothing is written until the user approves the amend** (orientation, connect, and shaping are all read-and-talk), the completion marker is written last, schema deltas are batched, and every step reads live and is idempotent.

## Talking to the user

The user runs their business; they are not configuring software. Everything you *say* to them is plain, friendly English, the kind a helpful colleague would use:

- **Before each step, say in a sentence what is about to happen and why it helps them** ("Next I'll connect the places your client info lives, so the hub can fill in details for you instead of you typing them in").
- **Never expose the plumbing.** No page or database IDs, no "data source", "schema", "introspect", "relation", "property", "marker", or "connector ID". Say "your hub", "the Clients list", "the fields", "the form".
- **When you need them to do something** (connect a tool, change a setting, remove the sample data), explain why it is needed, give clear short steps, and say what you will do once it is done.
- **Plain is not wordy.** A sentence of why, then the ask.

This governs only what the user sees. The internal routine (locating, reading, introspecting, the amend batch) stays exactly as the references specify; it just runs quietly behind plain narration.

## Before you start

**Locate the hub by asking the user, not by searching.** This skill is almost always run right after the user duplicated the template, so the fastest and most reliable locate is to have them hand it over directly. This **replaces** the shared spine's name-search locate (`_shared/shared-startup.md` step 1) for this skill: do not run that fuzzy resolution here.

The whole orientation is three quick moves, then you are talking to the user:

1. **Ask for the hub.** Plainly, for example: "Nice work duplicating the template. Paste me the link to your new hub page and I'll take it from there. (In Notion: open the page, click the ••• at the top right, and choose Copy link. Or just tell me what you named it.)" A pasted Notion URL contains the page ID, so use it directly; only if they give a name, do a single `search` to resolve it.
2. **`fetch` that page once.** This doubles as the Notion connectivity check (if it fails because Notion isn't connected, conduct connecting it, then retry) and returns the page's children. Confirm they include the four DBs (Clients, Projects, Pipeline, Tasks) and both stores (⚙️ Hub Config, 🧠 Skill Notes); if any are missing it is the wrong page, so ask again.
3. **One `search` of ⚙️ Hub Config for the `(System, Setup Status)` row**, then decide the mode (`references/system-state-and-recovery.md`): absent = fresh duplicate = first setup.

That is the whole orientation: two Notion calls (one `fetch`, one `search`), no hub-resolution and nothing read up front. Everything else the spine describes is deferred to the step that consumes it: per-DB introspection during the shaping walk, description resolution during a reshape, and the Skill Notes directives loaded only on a configured hub (a fresh duplicate ships ⚙️ Skill Notes empty). Read those parts of `_shared/shared-startup.md` when you reach them, and apply any Skill Notes directives as authoritative overrides.

This is the **only** skill that mutates schema (`notion-update-data-source`), creates or adjusts views, and owns the `Area = System` namespace. Its destructive writes (schema deltas, seed archive) are always batched and preview-first.

Load each reference as its phase begins, not upfront:
- `references/system-state-and-recovery.md` — the `Area = System` rows, mode detection, and the re-run / write-failure recovery model. Read this **first**, to detect the mode.
- `references/first-setup.md` — the full first-setup sequence (the heavy path).
- `references/shaping-and-amend.md` — the per-DB interview and the batch → preview → write amend (shared by first-setup and reshape).

## Modes — branch on hub state, never identity

Detect the mode from the shared hub (per `references/system-state-and-recovery.md`), then act:

- **Not configured** (no hub, or hub found with the demo seed and no `setup-complete` marker) → **first setup** (the heavy path). See `references/first-setup.md`.
- **Configured** (`(System, Setup Status) = setup-complete`) → **ask the user which** they want:
  - *Connect / verify this machine* (a teammate joining, or the user on a new laptop): probe + conduct-connect this machine's connectors, confirm the hub is reachable, done. No duplication, no reshape.
  - *Evolve the shape* (a targeted reshape): see the reshape path below.
- **Interrupted** (`(System, Setup Status) = in-progress`) → tell the user a prior setup didn't finish and offer to resume the undone tail. Re-running from the top is always safe; it reads live and reconciles.

Two people sharing one Notion workspace see an identical hub: identity is undetectable and irrelevant. Never guess a mode from who is running it; read the hub, and ask when the state is "configured".

## First setup (the heavy path)

Full detail in `references/first-setup.md`. The sequence, in order:

1. **Notion check** — no separate probe; the hub `fetch` in step 2 is the connectivity check. If it fails because Notion isn't connected, conduct connecting it first (Notion is the one required connector).
2. **Get the hub from the user** — ask them to paste the link to the hub they duplicated (or its name), and `fetch` it once. If they haven't duplicated yet, tell them to (their one click), wait, then ask. Reads only; nothing is written here.
3. **Verify structure** — the step-2 fetch already listed the children, so confirm the 4 DBs + 2 stores from it. The relation-integrity check is a deferred safety net, not an eager step: re-toggle a one-way relation only if a per-DB introspection during shaping reveals one. See `references/first-setup.md`.
4. **Connect + discover** — one guided "connect the tools that hold your client info (email, files, calendar, task tracker, chat), and name anything that can't be connected" ask; no slow per-tool probing; assemble a light source inventory.
5. **Shaping interview** — per-DB recommend-and-adjust walk (Clients → Projects → Tasks → Pipeline → body sections). See `references/shaping-and-amend.md`.
6. **Amend** — one preview, then on approval the run's first writes: mark setup in-progress, then apply every delta. See `references/shaping-and-amend.md`.
7. **Open the New Client form to public** — a guided manual step: walk the user through the Notion UI to make the form submittable by anyone with the link, then confirm by eye. Not an API write.
8. **Clear the demo seed** — find the 🤖 seed client and its related records structurally, then have the user delete them in the UI (the connector can't delete rows) and verify they're gone. First-setup only.
9. **Write the marker** — flip `Setup Status` to `setup-complete`; record Hub Name, Sources, Setup Date in the `Area = System` rows.
10. **Confirm + handoff** — recap, then offer to chain into `/client-create` for the first real client.

## Reshape (configured → evolve the shape)

Targeted, not the full walk. Ask "what would you like to change?", resolve the affected field or section live, then run the same amend machinery (`references/shaping-and-amend.md`): delta → preview → write → update the matching Hub Config row. The `setup-complete` marker stays. The user can ask for the full per-DB tour if they want it.

## Conduct vs perform

Four things this skill cannot do itself, so it *conducts* them (instruct, wait, confirm) rather than performing:
- **The user duplicating the template** — their one click; never automated (automating it abandons the spiked published-template relation-remap).
- **OAuth consent** — a hard security boundary; a skill can't click an OAuth screen.
- **Making the New Client form public** — a guided manual toggle in the Notion UI; the form's sharing state isn't reliably set-and-verified through the API, so the user makes it submittable-by-anyone and confirms by eye.
- **Deleting database rows** (the demo seed; a dropped field's orphaned Hub Config row) — the connector can drop a *property* but **cannot archive or delete a *row***, so the user deletes these in the UI and the skill verifies before continuing.

Everything else it **performs** directly (relation repair, schema property add / rename, marker + inventory writes via row *creation*, descriptions, view adjustments), preview-first where destructive.

## Hard rules

- **Branch on hub state, never identity.** Read the hub; ask when configured. Never infer the mode from who or which machine runs it.
- **Duplicate-then-amend only.** Never build the hub or any DB from scratch; only apply deltas to the duplicated template.
- **Never add or delete whole databases**, and never invite the user to. The 4 DBs are the backbone every skill resolves against. Shaping happens *within* them (rename the DB; rename / drop / add its fields).
- **Required anchors are rename-only, never droppable:** each DB's title and the Client relation on Projects / Tasks / Pipeline. Refuse a drop; offer a rename.
- **Batch → preview → write.** Collect every delta, show one preview, write only on explicit approval. **Nothing at all is written before that approval, not even an internal setup marker.** No surprise schema writes.
- **The marker is written last.** Never write `setup-complete` before the seed is cleared and every delta is applied. This is what makes re-run-from-top safe.
- **`Area = System` is reserved and internal.** Only this skill writes it; it is excluded from the shaping walk and the annotation flow.
- **Formula expressions can't be set via the API** — create everything else, flag any formula field for a manual paste.
- **Verify-and-report on any write failure; never claim false success.** Notion has no transactions, so there is no rollback: report exactly what landed and let a re-run reconcile.
- **First-setup-only steps stay first-setup-only:** clearing the seed never runs on a configured hub.

## What this does NOT do

- Populate content (no clients, projects, or tasks), except the optional `/client-create` handoff at the end.
- Build the hub from scratch, or manage / republish the published template.
- Add or delete whole databases.
- Touch real client data when clearing the seed (it is marker-based, demo records only).

## Learning loop (after setup or a reshape is written)

Reflect silently: did anything this run reveal a repeatable improvement to how this skill works (a better interview default, a delta that propagated awkwardly, a connector probe that tripped, a missing check)? Count only generalisable process tweaks, not facts about this one hub.

- Found nothing? Say nothing.
- Found one or more? Offer: "I noticed N possible improvement(s): [each as a one-line directive]. Save any to the hub's Skill Notes? (pick which, or none)."

On approval, write each as a new row in the `🧠 Skill Notes` DB, tagged `hub-configure` (or `global` if it applies to every skill). Never write without approval. Never edit this SKILL.md.
