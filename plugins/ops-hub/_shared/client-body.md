# Client page body

How every skill that writes a Clients page body composes it. Shared by `/client-create` (seeds it) and `/client-update` (refreshes it).

## Sections come from Hub Config, not this file

The body's sections are defined by the Hub Config rows where `Area = Client Body` (read during shared startup). Write each section as an H2 heading using the row's exact `Name`, in Hub Config order. Because both client skills read the same list, a section the user renames, drops, or adds via `/hub-configure` flows through automatically. Never hardcode the section list.

The default set shipped in the template:

- **Contacts** — everyone at the client worth knowing, with role and notes.
- **Engagement Overview** — at-a-glance state: status, what's in flight, open pipeline, live tasks, last invoice, lifetime value.
- **Engagement History** — past projects for this client and what each was worth.
- **Setup & Tooling** — any client-specific setup worth recording.
- **Tech Stack & Tools** — the systems and tools the client uses.
- **Communications Log** — recent themes and the last handful of interactions.
- **Opportunities & Risks** — things worth pitching, and things to watch.
- **Manual Notes** — free-form; never overwritten by a refresh.

**The never-overwrite section is identified by its description** (the Hub Config row whose description says the refresh never touches it), not by a hardcoded name. `/client-update` preserves it verbatim.

## Create vs update (the contract)

- `/client-create` writes the row's fixed properties + an initial body. It fills the sections it can from the supplied data (typically Contacts and Engagement Overview), scaffolds the rest with a short placeholder line, and always includes the never-overwrite section. It pulls from NO external connectors.
- `/client-update` refreshes the living sections from linked DBs and connected sources, and preserves the never-overwrite section verbatim. It never touches the fixed properties.

## Notion page-body markdown (general: applies to any page body)

Notion uses its own markdown flavor. The page icon and title are set on the page, not in the body.

- **Tables use XML-ish tags, NOT pipe tables** (pipes render as literal `|`):

      <table header-row="true">
      <tr><td>Name</td><td>Role</td><td>Email</td></tr>
      <tr><td>...</td><td>...</td><td>...</td></tr>
      </table>

- Headings: `##` (H2, the section anchors) and `###` (H3, sub-blocks). Keep anchor text exact, including any emoji.
- Bullets `- `, bold `**x**`, italic `*x*`, links `[label](url)` and `[email](mailto:...)`.
- Emoji inline is fine (type the character directly).
- Do NOT use callout, toggle, or column syntax. Headings, bullets, tables, and paragraphs only.

## Placeholder convention

For a section `/client-create` can't fill yet, write a single italic line, e.g. `_to be filled by /client-update_`. Never invent client facts to fill space.
