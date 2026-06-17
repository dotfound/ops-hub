# System state, mode detection, and recovery

The reserved `Area = System` namespace in `⚙️ Hub Config`, how `/hub-configure` detects which mode it's in, and why re-running from the top is always safe. Read this first on every run, to detect the mode before doing anything.

## The `Area = System` rows

All of `/hub-configure`'s durable state lives in the existing `⚙️ Hub Config` DB under a reserved `Area = System` namespace, reusing the `(Area, Name, Description)` columns (Name = key, Description = value). No new DB, no new columns, no separate page. The rows:

| Name | Description (value) | Written |
|---|---|---|
| Setup Status | `in-progress` or `setup-complete` (the row being absent = never configured) | step 2 (in-progress), step 9 (complete) |
| Hub Name | the hub's recorded name (the spine reads this to refine resolution) | step 9 |
| Sources | the light source inventory, e.g. `Gmail, Drive (connected) · Trello, spreadsheet (manual)` | step 9 |
| Setup Date | the date setup completed | step 9 |
| Client Body Sections | the ordered ` | `-delimited client-body section list (the body-section index skills read to enumerate sections) | step 9, and on reshape |
| Project Body Sections | the ordered ` | `-delimited project-body section list (the body-section index) | step 9, and on reshape |

These six are the System rows. They are **internal**: every other skill reads them (the spine does, for mode-awareness and the durable anchor) but none writes, shapes, describes, or annotates them. Only `/hub-configure` writes here.

### The `System` Area option may need adding

The template ships the `Area` select with options Clients / Projects / Tasks / Pipeline / Client Body / Project Body — **`System` is not among them**. Before writing the first System row, introspect the Hub Config DB's `Area` options; if `System` is absent, add it via `notion-update-data-source` (an ALTER on the select). This is the skill's own internal write, not user data, so it needs no shaping approval. (Template-finalisation note: ideally the template ships `System` as an option so this never fires; until it does, add it defensively.)

## Mode detection (run this first)

After shared startup, read the `(System, Setup Status)` row and decide:

- **Row absent** (and the demo seed still present) → **not configured** → first setup. See `first-setup.md`.
- **`setup-complete`** → **configured** → ask the user: *connect / verify this machine* or *evolve the shape* (reshape). Never guess which; the hub looks identical to every person and machine.
- **`in-progress`** → **interrupted** → tell the user a prior setup didn't finish, and offer to resume. Resuming is just re-running first setup from the top: every step is idempotent and reads live, so it walks past what's already done and finishes the tail. Offer the fast version (skip what's plainly applied) or the full re-walk.

A second signal corroborates "not configured": the 🤖 demo seed is still present (the skill clears it as the last setup step, just before the marker). Marker absent + seed present = fresh. Marker present + seed gone = done.

## Why re-run-from-top is always safe (no checkpoint machine)

There is deliberately **no checkpoint state machine**. Re-running from the top is safe because:

1. **The marker is written last** (the commit point). Bail before it and a re-run sees "not configured" (or "in-progress") and resumes; nothing falsely reads as done.
2. **Schema deltas are batched** (collected, previewed, written in one go). Bail during the shaping interview and nothing is written: no half-mutated schema.
3. **Every step is idempotent and reads live.** A re-walk shows the already-amended shape (so the user simply confirms it), the relation check finds healthy relations, the marker-based seed-find clears only whatever demo records remain.

Worst case is repetition, not corruption.

## Write-failure principle

Notion has no transactions, so there is **no rollback**. On any write failure:

- **Verify what actually landed** (re-fetch), and **report it exactly**. Never claim a write succeeded without confirming it.
- Leave the marker un-flipped if the failure was before step 9, so the hub stays "in-progress" / "not configured" and a re-run reconciles.
- Don't attempt a compensating delete unless the user asks; a re-run is the reconciliation path.

## Explicit bail (the user stops mid-setup)

If the user stops partway:

- **Don't write `setup-complete`.** Report what's applied: schema deltas that landed are *their shape now* (kept, not reverted); an un-cleared seed is harmless demo data.
- Tell them re-running `/hub-configure` resumes from where they are (it reads live and finishes the tail).
- If `Setup Status` was already flipped to `in-progress` (step 2), leave it; that is what triggers the resume offer next time.
