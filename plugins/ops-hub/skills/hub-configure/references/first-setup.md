# First setup — the heavy path

The full first-setup sequence for `/hub-configure`. Run only when mode detection (see `system-state-and-recovery.md`) finds the hub **not configured**. Each step reads live and is idempotent, and nothing is written until the user approves the amend (step 6), so re-running from the top is always safe.

## 1. Notion check

No separate probe call. The hub `fetch` in step 2 doubles as the connectivity check. If that fetch fails because Notion isn't connected, **conduct** connecting it: a skill can't click OAuth, so instruct the user to connect Notion in their Cowork connectors, wait, and retry. Notion is the one structurally required connector; nothing below works without it.

## 2. Get the hub from the user

You already did this in orientation (SKILL.md "Before you start"): asked the user to paste the hub link (or name) and `fetch`ed it once. Don't re-ask. For reference and edge handling, the locate is:

- The user pastes **the link to the hub they duplicated** (a Notion URL carries the page ID, so `fetch` directly), or its name (one `search` to resolve). Right after duplicating they have it to hand, so there is no fuzzy resolution.
- **Wrong page** (the fetch is missing some of the 4 DBs + both stores) → ask for the correct link.
- **Not duplicated yet** → tell them to duplicate the published template into their workspace (their one click; **not** automated, because the published-template flow preserves the relation-remap). Wait, then ask again.

Locating **writes nothing**; the hub is only read. Setup is not marked started, and no schema is touched, until the commit (step 6), after discovery, shaping, and the user's approval of the amend preview. (The `System` Area option ships in the template, so there is nothing to add here.)

## 3. Verify structure (relation check deferred)

The step-2 fetch already listed the children, so confirming the 4 DBs (Clients, Projects, Tasks, Pipeline) + both stores (⚙️ Hub Config, 🧠 Skill Notes) costs nothing extra here. Do **not** introspect the databases yet, and do **not** run a separate relation sweep: introspecting all four up front just to check relations is the main thing that makes the user wait, and on a fresh duplicate the relations are intact anyway (the duplication spike passed; this is a safety net, not a likely failure).

Fold the relation-integrity check into the shaping walk instead. Each DB is introspected when the interview reaches it (step 5), and that same introspection reveals whether its cross-DB relation is two-way (Clients ↔ Projects, Clients ↔ Tasks, Clients ↔ Pipeline, Projects ↔ Tasks). If one is found degraded to one-way, **re-establish it** via `notion-update-data-source` (`RELATION(ds_id, DUAL 'synced_name')`) and surface the repair in the amend preview. Nothing is fetched here that the shaping walk will not fetch anyway.

## 4. Connect + discover

**One guided ask, not a tool-by-tool interview.** Interrogating the user category by category and probing each named connector with a real call is slow: the user waits while every probe runs (four named Google tools is four round-trips, plus a connect-and-re-probe for any that are off). Instead, ask once, up front, for the user to connect everything that holds their client information, prompted by category with examples so nothing is forgotten:

> Connect the tools where your client information lives, in your Cowork connectors. For example:
> - **Email** (Gmail, Outlook)
> - **Files and folders** (Google Drive, Dropbox, OneDrive)
> - **Calendar** (Google Calendar)
> - **Task or project tracking** (Trello, Asana, Notion, Linear)
> - **Team chat** (Slack)
>
> Also tell me about anything that holds client information but can't be connected (a spreadsheet, a board with no connector, notes in your head), so I know you'll paste those in later. Only Notion is strictly required.

**Do not probe each connector with a real API call.** That is what makes the user wait, and it is unnecessary at setup: a connector that is connected but mis-scoped surfaces clearly when a skill actually uses it. Take the user's confirmation plus a **fast check of which connectors are now available** (the tool registry, not a live query), and move on.

Assemble a **light source inventory**: a coarse `source → connected | manual` list (e.g. `Gmail, Drive, Calendar (connected) · retainer spreadsheet (manual)`), persisted in `(System, Sources)` at step 9. This is *not* a per-field data-source map (that drifts and was retired); it is a one-line memory of what is wired up. The OAuth boundary still holds: the skill conducts connecting (instruct, wait, confirm); it never clicks OAuth itself.

## 5. Shaping interview

Walk the schema with the user so they reshape the default to their own. Per-DB, recommend-and-adjust: Clients → Projects → Tasks → Pipeline → then the client and project body sections. Full mechanics in `shaping-and-amend.md`. Collect deltas; write nothing yet.

## 6. Amend

This is the **first write of the whole run**: steps 1 to 5 (orientation, connect, shaping) are all read-and-talk, and nothing has touched the hub yet. Show the single preview, then write **only on the user's explicit approval**. On approval, the commit batch runs in order:

1. **Defensive only:** the `System` Area option ships in the template, but if it is somehow absent (an old duplicate, or a deleted option), add it now via `notion-update-data-source`.
2. **Write `(System, Setup Status) = in-progress`**, marking setup started so an interruption during the commit is recoverable.
3. **Apply every collected delta.** Propagation rules and the type / formula handling are in `shaping-and-amend.md`.

If the user bails before approving, nothing has been written and a re-run starts cleanly from the top.

## 7. Open the New Client form to public (guided manual step)

The template's New Client form ships **workspace-members-only** (so the public template can't be spammed). In the user's own hub it must accept external submissions, or future clients can't self-serve their intake. This is a **conducted manual step, not an API write**: the form's sharing state isn't reliably set-and-verified through the API end-to-end (the toggle is settable but not readable back, and a separate publish-to-web step may also be needed), so the user makes the change in the Notion UI and confirms it by eye.

Guide the user through it (Notion's current form-sharing flow):
- Open the Clients DB **"New client form"** view. At the top it shows **"Only members can fill out this form."**
- Click **Change** next to that message.
- Set **who can fill out this form** to **Anyone with the link (public)**.

The banner updates to reflect the new setting, so the user confirms by eye. (Optional extra check: open the form link in a private / incognito window and submit a test entry, which creates a Clients row they can delete afterwards.) Wait for the user to confirm before moving on. Never assert the form is public; rely on their visual confirmation.

## 8. Clear the demo seed (guided manual delete)

The template ships a 🤖-marked demo seed (a `🤖`-prefixed client + its related project, tasks, and a pipeline item) so relations and views render on duplication. Clear it now, **first-setup only**. The connector **cannot delete database rows** (only the user can, in the UI), so this is a **conducted** step, not a performed one:

- Find the seed **structurally**: locate the `🤖`-prefixed seed client, then walk its relations to gather the linked project, tasks, and pipeline item. Don't match on hardcoded names or IDs.
- **Present the exact records** (with their page links) and ask the user to delete them in the Notion UI (Notion trash, recoverable). Never ask them to delete a post-duplication record they may already have added.
- **Verify before moving on:** re-search for the 🤖 seed client and confirm it's gone before writing the marker (step 9). This keeps "marker present ⇒ seed cleared" honest.

This runs only when the marker is absent (mode detection gates it). It never runs on a configured hub.

## 9. Write the marker (and the section index)

The commit point. Write the `Area = System` rows (per `system-state-and-recovery.md`):

- Flip `(System, Setup Status)` from `in-progress` to **`setup-complete`** (update in place).
- Write `(System, Hub Name)` = the hub's name.
- Write `(System, Sources)` = the light inventory from step 4.
- Write `(System, Setup Date)` = today.
- Write `(System, Client Body Sections)` and `(System, Project Body Sections)` = the final ordered ` | `-delimited section list for each body (the documented default, or as reshaped in the interview). These index rows are how the body skills enumerate sections reliably; write them whether or not the user reshaped, so they're always present and authoritative.

Order matters: seed cleared (step 8) **then** marker (step 9), so "marker present" always means fully set up and seed gone.

## 10. Confirm + handoff

Recap what changed: the renames / additions applied, the form opened (pending the user's visual confirm), the seed cleared, the sources wired up. Then **offer to chain into `/client-create`** for the user's first real client, so setup flows straight into first use.
