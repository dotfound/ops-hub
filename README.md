# Ops Hub

A duplicatable **Notion operations hub** plus the **Cowork skills plugin** that stands it up and runs it. Client-centric: clients, projects, tasks, and pipeline, with a living context page on each client and project.

Generic by design, so one repo reuses as a template across clients. All per-client variation (the shaped hub schema, the semantic descriptions, the shared learning notes) lives in the Notion hub itself, not in this code, which stays near-static after build.

## Two pieces

1. **The Notion template** (published separately) holds the 4 databases, their relations, saved views, a pre-filled Hub Config semantic store, and a Skill Notes learning store. The user duplicates it into their own workspace in one click.
2. **This plugin** (`plugins/ops-hub/`) is the skills that operate the hub. `/hub-configure` is the setup conductor; the rest are create/update pairs per object.

## Structure

    .claude-plugin/marketplace.json      marketplace manifest
    plugins/ops-hub/
      .claude-plugin/plugin.json         plugin manifest (version intentionally omitted)
      skills/                            the skills (one SKILL.md per skill)
      _shared/                           shared references (the locate-read-introspect spine)

## Install

Add this repo as a marketplace in Cowork (`/plugin`, Marketplaces, add repo), install `ops-hub`, then `/reload-plugins`. Run `/hub-configure` to connect MCPs, locate the duplicated hub, and shape it.

## Versioning

`version` is intentionally omitted from `plugin.json` so each pushed commit is picked up as the latest. Updates are deliberate: `/plugin marketplace update`.
