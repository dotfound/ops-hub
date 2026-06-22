# Client body — composition guide

How to compose a client record's body sections from the gathered sources. Used by **client-write** (composes every section) and **client-update** (folds new activity into these same sections).

**Compose what the config lists.** The body is `config.body` — an ordered list of sections, each a `{ heading, purpose }`, that a team can reshape. This guide covers the **default** sections; for any section not covered here, compose from its configured `purpose` and the available sources, and leave a short italic placeholder if there's no signal. Keep tone factual and short — no marketing language.

**Conventions (from hub-conventions):** tables use `<table>` XML, never pipe tables; headings are exact anchors (keep the emoji); the stamp is the first body line; Manual Notes is never composed. Default look-back is **2 years**.

**Resolving sources:** the client's `sources` (from config) name where to look — linked records (via the structural relations), invoicing, email, calendar, files. Resolve each at run time; tolerate per-source failure (placeholder the affected section, don't abort). Infer the client's email domain from known contact emails; if the only address is a generic provider (gmail/outlook/…), ask the user for the domain.

---

## 👥 Contacts

A `<table>`: Name · Role · Email · Notes. Build from, in order:
1. Contacts already in the prior managed body (preserve them).
2. Participants on linked records and on email threads at the client's domain — add anyone not already listed, with a best-guess Role from email-signature lines (read a few recent full threads for signatures).

Mark exactly **one** row primary (⭐), preferring: the previously-⭐ row → the `main_contact_email` match → the most-active correspondent in the last 90 days. The ⭐ row's name/email/role sync to the `main_contact_*` properties (client-write fills those).

## 📈 Engagement Overview

Mechanical render, no judgement — a bulleted list:
- **Status** (the `status` property)
- **In-flight projects** — linked Projects whose status reads active/in-progress (else *none*)
- **Open pipeline** — linked Pipeline rows not Won/Lost (else *none*)
- **Active tasks** — count of linked Tasks not Done
- **Last invoice** — most recent invoice date from the invoicing source (else *none*)
- **Lifetime value** — total invoiced to date, from the invoicing source

## 📚 Engagement History

A `<table>` of completed projects, most recent first: Project · Completed · Invoice ref(s) · Value. Pull completion + values from linked Projects and invoicing. Then a 2–3 sentence factual narrative of the engagement arc — when it started, the dominant kinds of work, total value to date.

## 🛠 Tech Stack & Other Tools

A short bulleted list (5–10 items), inferred from: email-signature footers (CMS, hosting, "powered by"), any files-context note, and recent thread subjects. Keep each bullet short. Thin signal → one italic line: `_inferred from limited signal — add to this list as you learn more_`.

## 💬 Communications Log

Two sub-blocks:
- **### Recent themes (last 3–6 months)** — 3–5 one-line bullets, grouped by topic not by thread; skip noise (invoice-only, calendar invites).
- **### Last 5 interactions** — a `<table>` merging email threads (one row per subject) and calendar meetings, most recent first: Date · Type (`email-thread` / `meeting`) · Subject / Title · one-line factual summary.

## 🎯 Opportunities & Risks

Two sub-blocks, composed from everything gathered:
- **### Opportunities** — 2–4 bullets. Tech-stack gaps that map to the team's services, themes raising new work types, paused projects that could resume. If the hub has a **service catalogue** configured as a source (a doc/path the config points at), map gaps against it; otherwise infer conservatively.
- **### Risks** — 0–3 bullets. A lapsed/at-risk status, a long gap since the last invoice, unanswered recent threads, single-point-of-contact fragility.

Quiet is fine — no signal for a side → `_no clear {opportunities|risks} surfaced from current signal_`.

## 📝 Manual Notes

Human-owned — never composed or edited. client-write **seeds** the default wording only on a first build (no prior Manual Notes present):
> *Use this section for any notes you want to preserve through future context refreshes. The update skill will never touch anything below this heading.*

---

## For client-update (folding, not rebuilding)

Fold only activity since the stamp into the sections above, preserving prior content:
- **Communications Log** — prepend new interactions; refresh themes only if the recent mix clearly shifted.
- **Engagement History / Overview** — add newly-completed projects; update the mechanical Overview counts.
- **Opportunities & Risks** — add newly-surfaced items; don't delete standing ones unless clearly resolved.
- **Contacts / Tech Stack** — add genuinely new entries; leave the rest.

A section with nothing new is left untouched. Manual Notes is never touched. Re-stamp on commit.
