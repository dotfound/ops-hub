# Ops Hub: orientation cache

**Status:** approved design, pending implementation plan
**Date:** 2026-06-17
**Affects:** `ops-hub` plugin: `_shared/`, `hub-configure`

## Problem

Every ops-hub skill runs a shared, silent "orient to the hub" routine (`_shared/shared-startup.md`) before its own work. Measured on `/client-create`, this orientation takes about two minutes before the skill does anything client-related.

## Root cause

The orientation re-discovers the entire hub from scratch on every run and deliberately stores no IDs between runs ("resolve live, never hardcode", `shared-startup.md` lines 18 and 44). In order it:

1. Name-searches Notion for the hub page, then its six databases.
2. Resolves each field's description with a separate Notion `search`, one field at a time, in sequence.
3. Fetches each database's schema.
4. Reads the section index and Skill Notes.

Each step is a remote Notion MCP round-trip, run in sequence, so a single startup is 20 to 40 calls. Step 2 dominates: the connector has no bulk row-read (documented in `shared-startup.md` lines 62 to 76), so descriptions can only be fetched one search per field.

The design conflated two separate rules:

- *Do not bake Notion IDs into the shared skill code.* Correct: IDs differ per hub and the shared code ships to everyone.
- *Do not remember anything between runs.* This is the rule costing two minutes, and it is not required by the first.

A **local, per-machine cache** separates the two: it remembers the resolved orientation on the operator's own machine without baking anything into shared code.

## Chosen approach

Full orientation snapshot (chosen over location-only and live-optimisation). Persist the complete result of orientation to a local file. Shared startup reads that file and runs one cheap validity check instead of the 20-to-40-call discovery. The existing live resolution is retained unchanged as both the fallback and the cache-populator, so a cache miss is exactly as fast as today and a cache hit is near-instant.

## The cache file

**Location:** `~/.config/ops-hub/hub-cache.json`. Outside all plugin copies on purpose: the plugin is a copy chain (dev repo to GitHub to marketplace clone to runtime cache), the runtime copy is overwritten on every plugin update, and the cache is per-machine, per-hub private data that must never sync to other installs. The path is a fixed constant, identical on every machine, so the skill instructions hardcode it. Hardcoding the constant local *path* is precisely what lets the skills avoid hardcoding the per-hub Notion *IDs*.

**Shape:**

```json
{
  "format": 1,
  "defaultHub": "<hub-page-id>",
  "hubs": {
    "<hub-page-id>": {
      "hubName": "Notion Ops Hub",
      "cacheVersion": 4,
      "dataSources": {
        "Clients": "<data-source-id>",
        "Projects": "<data-source-id>",
        "Pipeline": "<data-source-id>",
        "Tasks": "<data-source-id>",
        "Hub Config": "<data-source-id>",
        "Skill Notes": "<data-source-id>"
      },
      "schema": {
        "Clients": { "Company Name": "title", "Status": "status" }
      },
      "descriptions": {
        "Client|Status": "What stage the relationship is at",
        "Client Body|Engagement Overview": "..."
      },
      "bodySections": {
        "Client Body": ["Contacts", "Engagement Overview"],
        "Project Body": ["Task table", "Next steps"]
      }
    }
  }
}
```

Notes:

- `hubs` is keyed by hub page ID so multiple hubs, or a teammate's separate setup, never collide. `defaultHub` records the most recently resolved hub.
- `descriptions` keys are `Area|Name` (Area disambiguates names shared across DBs, e.g. `Status`, `Client`, `Title`).
- `schema` is the user's reshaped property set per DB (property name to Notion property type).
- `bodySections` mirrors the `(System, … Body Sections)` index rows.

## Fast path (the change to `_shared/shared-startup.md`)

A new step 0 ahead of today's step 1:

1. Read `~/.config/ops-hub/hub-cache.json`. Absent or unparseable means cache miss; go to live resolution.
2. Select the hub entry: the sole entry, else `defaultHub`. None selectable means cache miss.
3. **Validity handshake (one call).** Using the entry's cached `Hub Config` data-source ID, do one targeted `search` for the `(System, Cache Version)` row and read its value.
   - Lookup fails (hub gone, IDs stale) means cache miss.
   - Value differs from the entry's `cacheVersion` means cache stale.
   - Value matches means **cache hit.**
4. **Cache hit:** load IDs, schema, descriptions and section index from the entry. Load Skill Notes live (see below). Skip steps 1 to 5 of today's routine entirely. One Notion call total.
5. **Cache miss or stale:** run today's full live resolution unchanged (steps 1 to 6), then write/refresh the entry and `defaultHub`, stamping the live `cacheVersion`.

## Correctness

- **Version handshake.** `/hub-configure` is already the only skill permitted to mutate schema. It writes a new `(System, Cache Version)` value (monotonic integer, starts at 1 at first-setup, increments on every reshape amend) into Hub Config on every schema change, and writes the same value into the local entry. A reshape on any machine therefore invalidates every machine's cache on its next run.
- **Self-heal.** If a skill acts on a cached field that proves absent live (a field renamed directly in the Notion UI, bypassing `/hub-configure`), it discards the cache entry, re-resolves live for the remainder of the run, and refreshes. This covers the one staleness hole the version handshake cannot: an out-of-band edit.

## Freshness: who writes the cache

- `/hub-configure` writes the entry at the end of first setup, after every reshape, and when connecting a new machine (each machine self-populates its own local file). It also bumps `(System, Cache Version)`.
- Any skill that falls through to live resolution rewrites the entry on exit. The cache is therefore self-maintaining: even with no `/hub-configure` re-run, the first slow run after a change repopulates it and the next run is fast.

## Not cached (stays live)

Skill Notes load live every run, unchanged. They are learning-loop directives written by every skill (not only `/hub-configure`), so a version-stamped cache would hide a new note until the next reshape. Skill Notes is one capped `search`, not the bottleneck.

## New Notion state

One new row in `⚙️ Hub Config`: `(System, Cache Version)`. It belongs to the reserved `Area = System` namespace, written and owned solely by `/hub-configure`, and excluded from the field lookup, shaping walk and annotation flow exactly like the other `System` rows.

## Footprint

- **New** `_shared/hub-cache.md`: the cache file path, JSON shape, the validity handshake, the self-heal rule, and the read/write/refresh responsibilities. Referenced by `shared-startup.md` the same way that file is referenced by each SKILL.
- **Edit** `_shared/shared-startup.md`: add step 0 (fast path) and the refresh-on-fallback rule; cross-reference `hub-cache.md`.
- **Edit** `hub-configure/SKILL.md`, `references/first-setup.md`, `references/shaping-and-amend.md`: write/refresh the snapshot and bump `(System, Cache Version)` at first-setup, reshape and connect-machine; document `(System, Cache Version)` alongside the other `System` rows in `references/system-state-and-recovery.md`.
- **No change** to `client-create`, `client-update`, `project-create`, `project-update`, `tasks-create`: they inherit the faster shared startup unchanged.

## Edge cases

- **Corrupt or unparseable file** is treated as a cache miss; the next live resolution overwrites it.
- **Old `format`**: entries whose `format` differs from the current reader are ignored and rebuilt.
- **Missing directory**: the write step creates `~/.config/ops-hub/` if absent.
- **Hub deleted and recreated** (new IDs): the cached `Hub Config` data-source ID stops resolving, the handshake fails, and live resolution rebuilds the entry under the new page ID.
- **Multiple cached hubs**: the fast path uses the sole entry or `defaultHub`; if neither selects cleanly it falls back to live name-resolution (which already disambiguates by asking). Multi-hub operators keep correctness, losing the fast path only in the ambiguous case.
- **Concurrent writes** (two skills at once): last-write-wins is acceptable for an interactive single-operator tool; no locking.

## Privacy

The snapshot holds the operator's own hub: page and data-source IDs, field names, field descriptions, section names, hub name. No secrets, no credentials. It is local-only and never synced.

## Out of scope

- Optimising the live resolution itself (the "no cache" option). The cache makes a cache hit fast; the live path is unchanged. A later pass could also make description resolution lazy, but it is not required here.
- Caching Skill Notes.
- Any change to the five content skills beyond inheriting shared startup.

## Success criteria

- A warm `/client-create` (valid cache) completes orientation in roughly one Notion round-trip rather than 20 to 40, cutting the pre-work wait from about two minutes to a few seconds.
- A cold or stale run is no slower than today and leaves a valid cache behind.
- A reshape via `/hub-configure` is reflected on the next run of every machine (version bump), and a direct-in-Notion field rename is caught within one run (self-heal).
- No skill ever acts on stale schema without detecting it.
