# System state, mode detection, and recovery

The reserved `Area = System` namespace in `⚙️ Hub Config`, how `/hub-configure` detects which mode it's in, and why re-running from the top is always safe. Read this first on every run, to detect the mode before doing anything.

## The `Area = System` rows

All of `/hub-configure`'s durable state lives in the existing `⚙️ Hub Config` DB under a reserved `Area = System` namespace, reusing the `(Area, Name, Description)` columns (Name = key, Description = value). No new DB, no new columns, no separate page. The rows:

| Name | Description (value) | Written |
|---|---|---|
| Setup Status | `in-progress` or `setup-complete` (the row being absent = never configured) | commit start / step 6 (in-progress), step 9 (complete) |
| Hub Name | the hub's recorded name (the spine reads this to refine resolution) | step 9 |
| Sources | the light source inventory, e.g. `Gmail, Drive, Calendar` | step 9 |
| Setup Date | the date setup completed | step 9 |
| Client Body Sections | the ordered ` | `-delimited client-body section list (the body-section index skills read to enumerate sections) | step 9, and on reshape |
| Project Body Sections | the ordered ` | `-delimited project-body section list (the body-section index) | step 9, and on reshape |

These six are the System rows. They are **internal**: every other skill reads them (the spine does, for mode-awareness and the durable anchor) but none writes, shapes, describes, or annotates them. Only `/hub-configure` writes here.

### The `System` Area option ships in the template

The template ships the `Area` select with `System` already among its options (Clients / Projects / Tasks / Pipeline / Client Body / Project Body / System), so a fresh duplicate already has it and the skill never adds it during setup. **Defensive fallback only:** if `System` is somehow absent (an old duplicate, or a user who deleted it), the skill adds it via `notion-update-data-source` as the first action of the **commit batch (step 6)**, never before the user has approved the preview. It is the skill's own internal write, not user data, so it carries no separate shaping approval, but it still waits for the commit so nothing lands pre-input.

## Mode detection (run this first)

Right after fetching the hub the user gave you, read the `(System, Setup Status)` row from ⚙️ Hub Config with one targeted `search`, and decide from it **alone** (a fresh duplicate ships ⚙️ Skill Notes empty, so there's nothing to load on the first-setup path; load Skill Notes only when the hub is configured, before a reshape):

- **Row absent** → **not configured** → first setup. See `first-setup.md`.
- **`setup-complete`** → **configured** → ask the user: *connect / verify this machine* or *evolve the shape* (reshape). Never guess which; the hub looks identical to every person and machine.
- **`in-progress`** → **interrupted** → tell the user a prior setup didn't finish, and offer to resume. Resuming is just re-running first setup from the top: every step is idempotent and reads live, so it walks past what's already done and finishes the tail. Offer the fast version (skip what's plainly applied) or the full re-walk.

**Do not fetch the demo seed to corroborate the mode.** By construction the seed and the marker move together (the seed is cleared as the last setup step, just before the marker is written), so Setup Status decides on its own: marker absent means fresh, marker present means done. The seed is located and cleared later, at first-setup step 8, the only place its presence actually matters. Reading it during mode detection is a wasted search on the critical path.

## Why re-run-from-top is always safe (no checkpoint machine)

There is deliberately **no checkpoint state machine**. Re-running from the top is safe because:

1. **The marker is written last** (the commit point). Bail before it and a re-run sees "not configured" (or "in-progress") and resumes; nothing falsely reads as done.
2. **Nothing is written before the commit.** Orientation, connect, and shaping are all read-and-talk; schema deltas are collected, previewed, and written in one go only on approval. Bail any time before that approval and nothing at all has been written (not even the in-progress marker): no half-mutated schema, no orphaned setup state.
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
- If the commit had begun and `Setup Status` was already set to `in-progress` (step 6), leave it; that is what triggers the resume offer next time.
