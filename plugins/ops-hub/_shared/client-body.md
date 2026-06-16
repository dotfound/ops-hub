# Client page body

The single spec for composing a client's Notion page body. Shared by `/client-create` (builds it on migration) and `/client-update` (refreshes it thereafter). **Both produce the same body, at the same depth, from the same sources.**

## Create vs update (the contract)

The only differences between the two skills:

- `/client-create` also writes the row's fixed properties, and starts Manual Notes fresh.
- `/client-update` never touches the fixed properties, and preserves the existing Manual Notes verbatim.

Otherwise the body-composition below is one operation used identically by both. The difference is only whether the row exists yet.

## Sections come from Hub Config, not this file

The body's sections are the Hub Config rows where `Area = Client Body` (read during shared startup). Write each as an H2 using the row's exact `Name`, in Hub Config order. Both client skills read the same list, so a section the user renames, drops, or adds via `/hub-configure` flows through automatically. Never hardcode the section list.

Default set shipped in the template: Contacts, Engagement Overview, Engagement History, Setup & Tooling, Tech Stack & Tools, Communications Log, Opportunities & Risks, Manual Notes.

**The never-overwrite section is identified by its description** (the Hub Config row whose description says the refresh never touches it), not a hardcoded name. `/client-update` preserves it verbatim; `/client-create` seeds it with a short prompt line.

## Sources (pull from whatever is connected; tolerate per-source failure)

Gather in parallel where independent. A dead or absent source renders its section with an explicit placeholder; never abort the whole skill over one missing source.

- **Linked Notion DBs** — Projects, Tasks, Pipeline, filtered by the Client relation.
- **Gmail** — recent client threads (themes, last interactions).
- **Calendar** — recent client meetings.
- **Drive** — the client's folder (from the Drive Folder URL property).
- **Supplied data** — anything the user pasted or pointed to (the main input for `/client-create`).

## Composing each section

- **Contacts** — a table of people at the client (from supplied data + email signatures), role + notes. Mark the primary.
- **Engagement Overview** — mechanical: status, in-flight projects, open pipeline, active task count.
- **Engagement History** — completed projects and their values (from the Projects DB Fee), most recent first, plus a 2-3 sentence factual arc.
- **Setup & Tooling** and **Tech Stack & Tools** — inferred from Drive docs, email signatures, supplied data. Thin signal renders one italic "add as you learn" line.
- **Communications Log** — recent themes (3-5 one-line bullets) + a table of the last ~5 interactions (Gmail threads + meetings), most recent first.
- **Opportunities & Risks** — composed from everything gathered. Quieter is fine; render an italic "none surfaced" line for an empty side.
- **Manual Notes** — free-form. `/client-create` seeds a prompt line; `/client-update` preserves it verbatim.

## Notion page-body markdown (general: applies to any page body)

The page icon and title are set on the page, not in the body.

- **Tables use XML-ish tags, NOT pipe tables** (pipes render as literal `|`):

      <table header-row="true">
      <tr><td>Name</td><td>Role</td><td>Email</td></tr>
      <tr><td>...</td><td>...</td><td>...</td></tr>
      </table>

- Headings: `##` (H2, the section anchors) and `###` (H3, sub-blocks). Keep anchor text exact, including any emoji.
- Bullets `- `, bold `**x**`, italic `*x*`, links `[label](url)` and `[email](mailto:...)`.
- Emoji inline is fine. Do NOT use callout, toggle, or column syntax: headings, bullets, tables, and paragraphs only.

## Preview and write

Always preview the full composed body (and, for `/client-create`, the proposed properties) in chat before writing, with a one-line note of which sources were used. Write only on approval. `/client-create` writes the properties first, then the body; `/client-update` writes the body only.
