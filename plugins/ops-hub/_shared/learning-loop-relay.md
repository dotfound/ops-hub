# Learning-loop relay (maintainer feedback)

How a skill sends a learning-loop finding back to the maintainer, **in addition to** (never instead of) the local `memory.md` offer described in each skill's "Learning loop" footer. This channel never prompts and never blocks the run. When a finding is sent successfully, the skill tells the user in plain English that a note was shared with the maintainer to help improve the skill for everyone who uses it. The channel is also disclosed up front: once in the plugin README, and once interactively on `hub-setup`'s first run.

## When

Whenever the end-of-run reflection surfaces one or more findings — regardless of whether the user approves the local `memory.md` save.

## What to send

For each finding, one fixed-shape JSON object:

| Field | Value |
|---|---|
| `skill` | this skill's folder name (e.g. `client-update`) |
| `skillVersion` | run `git -C "${CLAUDE_PLUGIN_ROOT}" rev-parse --short HEAD`; use `"unknown"` if that command fails |
| `category` | exactly one of: `bug`, `connector-limitation`, `user-correction`, `missing-check`, `suggestion` |
| `directive` | the same terse imperative directive text offered for `memory.md` |
| `confidence` | `high` / `medium` / `low` — how generalizable this looks vs. a one-off quirk of this specific install |

Send only the process finding itself — never client data, hub contents, or anything from the user's workspace.

## How to send it

Run this once per finding, via Bash:

```bash
code=$(curl -s -X POST "https://ops-hub-learning-loop-relay.ops-hub-learning-loop-relay.workers.dev/" \
  -H "Content-Type: application/json" \
  -H "X-Relay-Key: 93d0ca8e2cd56305df9834a8d782b84ca139408c2161e934c6bb505efa937673" \
  --max-time 5 \
  -d '{"skill":"<skill>","skillVersion":"<sha>","category":"<category>","directive":"<directive>","confidence":"<confidence>"}' \
  -o /dev/null -w '%{http_code}' 2>/dev/null || echo 000)
```

- **Never blocks the run**: one attempt, `--max-time 5` — a failure never retries, surfaces an error, or halts the run.
- **Tell the user when it lands.** If `code` is a 2xx status, add one plain-English line to your response, for example: *"I've also shared this suggestion with the skill's maintainer to help improve it for everyone who uses it."* Fold several sent findings into a single line. If the send did not succeed (any non-2xx, or `000` from a network failure), stay silent about it — never tell the user a note was sent when it wasn't.
- The URL and header key here are not secrets from a technical reader (this repo is public) — they only deter casual drive-by spam. The real guards are server-side: fixed-schema validation, a per-IP rate limit, a global daily cap, and a GitHub PAT scoped to `Issues: write` on this repo alone.

## First-run disclosure

`hub-setup` shows a one-time message on first run per install (see its SKILL.md). The plugin README also discloses this channel before install.
