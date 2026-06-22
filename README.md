# Ops Hub

A duplicatable **Notion operations hub** plus the **Claude Code skills** that shape it to your team and keep it current. Client-centric: clients, projects, tasks, and pipeline, with a living context page on each client and project.

Generic by design — one plugin serves any team. All per-team variation (the shaped schema, what each field means, the body layouts, where to look when enriching) lives in a **config page inside the Notion hub**, not in this code.

## Three pieces

1. **The Notion template** holds the four databases (Clients, Projects, Tasks, Pipeline), their relations, saved views, a New-client intake form, and a pre-filled **⚙️ Hub Config** page. You duplicate it into your own workspace in one click.
2. **The setup web app** lets you rename / add / drop fields and say what each one means, then emits a prompt you paste into Claude. No backend and no Notion access — it just builds the prompt. Hosted on the dotfound artefacts library (not in this repo).
3. **This plugin** (`plugins/ops-hub/`) is the skills that operate the hub.

## The skills

| Skill | What it does |
|---|---|
| `hub-setup` | Shapes (or reshapes) the hub from the web app's output: edits the Notion schema, writes the config page, refreshes the cache. The only skill that changes hub structure. |
| `client-write` | Composes a whole client record — new or a full refresh — from its linked work and connected sources. |
| `client-update` | Folds new activity into a client's body since the last refresh. |
| `project-write` | Composes a whole project record from a brief/SOW; offers to derive its task list. |
| `project-update` | Folds progress into a project body; may propose a status change. |
| `tasks-create` | Turns a brief, SOW, transcript, or notes into linked Task records. |

Every skill reads the config page + live schema before acting, finds structural fields (titles, relations) by role so it survives renames, addresses ordinary fields by their configured meaning, and **confirms before every write** — it never touches read-only/formula fields or your Manual Notes.

## Structure

    .claude-plugin/marketplace.json      marketplace manifest
    plugins/ops-hub/
      .claude-plugin/plugin.json         plugin manifest (version omitted — every push is latest)
      _shared/
        hub-conventions.md               the cross-cutting machinery every skill points to
        config.default.json              the shipped default config (mirrors the template)
      skills/                            one folder per skill (SKILL.md + memory.md + references)

## Install

In Claude Code / Cowork: `/plugin`, add this repo as a marketplace (`dotfound/ops-hub`), install `ops-hub`, then reload. Duplicate the Notion template into your workspace, open the setup web app to shape your hub, paste its output into Claude, and run `hub-setup`. From then on, `client-write` / `project-write` / `tasks-create` build records and the `-update` skills keep them current.

## Versioning

`version` is intentionally omitted from `plugin.json`, so each pushed commit is picked up as the latest. Updates are deliberate: `/plugin marketplace update`.
