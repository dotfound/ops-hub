# Task derivation — turning text into tasks

How to turn a brief, SOW, transcript, or notes into a task list. The principle: **everything actionable becomes a task.** Nothing actionable is left implicit.

## What becomes a task

- **Every action the work requires** — one task each. Split a deliverable into multiple tasks when it has clear sub-pieces (e.g. "GA4 audit" → configuration review, event-coverage review, custom-dimensions audit).
- **Anything the client owes** — access, sign-off, content, a decision — becomes a **chase/confirm task you own** ("Confirm GA4 Editor access from {client}"), assignee = you. Never a task assigned to the client.
- **Decisions and follow-ups surfaced in a transcript** — each an explicit task, owned by whoever the text implies (default: you).

## Standard bracket tasks (for a project brief/SOW)

When the text is a project SOW, always include these around the deliverable tasks:
- **Kickoff** — `Set up kickoff call`, `Confirm access` (the client-owed access items).
- **One section's worth per deliverable** — 1–3 tasks per SOW deliverable bullet, drawn from the deliverable + the Context.
- **QA & Handover** — `QA + validation`, `Handover + documentation`, `Client sign-off`.

For a transcript or loose notes (not a SOW), skip the bracket tasks unless they're clearly warranted — derive tasks from what's actually said.

## Effort

Conservative, from the text and similar work. Don't pretend precision — use the typical buckets: `0.5h`, `1h`, `2h`, `3h`, `4h`, `6h`, `8h`. Set effort only if the text implies a size; otherwise leave it unset.

## Due date

Derive from the brief's timeline if it has one (Kickoff → week 1, deliverables across the build phase, QA + handover at the end). If there's no confirmed kickoff date (typical — "anchored to confirmed kickoff"), leave due dates unset and note "TBC (Week N)" in the preview rather than inventing a date.

## The 5-section body

Each task's page body uses the configured task body sections, with these exact labels:
- **User story** — who wants this and why, one line.
- **Background** — context the doer needs.
- **Task description** — what to do (a paragraph, or a short breakdown).
- **Definition of done** — how we know it's complete.
- **Useful context** — links, references, anything that helps.

A sparse body is fine. If a section genuinely doesn't apply, write "(none — routine X)" rather than inventing content. Quality over completeness.

## Naming

Give each task a clear imperative name. If the source groups tasks (Kickoff, a deliverable, QA & Handover), prefix the group onto the name so the flat task list stays grouped-feeling: `Kickoff — Confirm access`, `GA4 Audit — Event coverage review`.
