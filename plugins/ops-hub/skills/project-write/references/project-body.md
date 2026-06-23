# Project body — composition guide

How to compose a project record's body from the brief or SOW. Used by **project-write** (composes every section) and read by **project-update** (which adds progress sections without touching these).

**Compose what the config lists.** The body is `config.body` — an ordered list of sections, each a `{ heading, purpose }`, that a team can reshape. The defaults follow the SOW scope structure (below). For any section not covered here, compose from its configured `purpose` and the brief, and leave a short italic placeholder if the brief doesn't cover it.

**Voice (the SOW house style).** Plain, declarative, slightly clinical. No marketing language, no hedging, no superlatives. "We" = the team; "you" = the client. Short sentences; lists over prose for anything enumerable. British English, no Oxford comma. Money always `£X,XXX + VAT`. Dates `DD/MM/YYYY`. Durations in working days ("10 working days"), never "a fortnight".

**Conventions (from hub-conventions):** `<table>` XML never pipe tables; headings are exact anchors (keep emoji); the stamp is the first body line; Manual Notes is never composed. The body holds **no tasks** — deliverables become Task records via `tasks-write`, shown through the template's task views.

---

## 🧭 Context

One paragraph. The client situation, what's prompting the work, and the boundary of what this project covers. No history, no fluff.

## 🎯 Scope

Two parts under bold sub-headings:
- **Outcomes at completion** — a bulleted list of outcome statements: states the *client* will observe when the work is done (not things the team did). "X is live and producing Y", not "we built X".
- **Definition of done** — one line: the binary completion criterion (typically the outcomes plus the validation point).

## 📦 Deliverables

A bulleted list of concrete deliverables — each a tangible artefact or named piece of work, with platform / event / validation method where useful. Don't repeat the outcomes; outcomes are the destination, deliverables are what gets handed over. Include kickoff/handover as deliverable bullets if they belong.

## 🚫 Out of scope

A bulleted list, explicit. Better to over-specify than leave ambiguity ("Ongoing reporting or monitoring post-launch", "Migration of any existing…", "Training beyond the handover materials").

## 🔗 Assumptions & dependencies

One combined section (don't split assumptions from dependencies — they overlap by design). Lead with a bulleted list of load-bearing conditions the price/timeline rest on. Then a bold **To be provided** sub-heading with a bulleted list of the access and inputs the client must furnish (e.g. "GA4: Editor access", "Sign-off on parity tolerance ahead of go-live").

## 🗓 Timeline

Bulleted phases with durations (`~10 working days`, `5 working days`). The **final bullet anchors completion** to a milestone ("Project completion: anchored to {client} written sign-off on the QA report").

## 👥 Project team

Two bullets: the customer's manager (name, role, company) and the team's manager (name, role).

## 📝 Manual Notes

Human-owned — never composed or edited. project-write **seeds** the default wording only on a first build (no prior Manual Notes present):
> *Use this section for any notes you want to preserve through future context refreshes. The update skill will never touch anything below this heading.*

---

## Progress sections (owned by project-update, not written here)

`project-update` inserts and refreshes **Work so far** and **Next steps** immediately above Manual Notes, from the linked tasks and any given input. **project-write does not create them** — they appear on the first `project-update`. Keep the scope sections above static; progress lives only in those two.
