// worker/src/index.ts
import { validatePayload } from "./schema";
import { createGitHubIssue } from "./github";

export interface Env {
  RELAY_HEADER_KEY: string;
  GITHUB_PAT: string;
  GITHUB_REPO: string;
  DAILY_CAP: string;
  RATE_LIMITER: RateLimit;
  DAILY_CAP_KV: KVNamespace;
}

const HEADER_KEY_NAME = "X-Relay-Key";
const DAILY_CAP_KEY_PREFIX = "issue-count:";
const DAILY_CAP_TTL_SECONDS = 172800; // 2 days — comfortably outlives one UTC day boundary

function todayKey(): string {
  return `${DAILY_CAP_KEY_PREFIX}${new Date().toISOString().slice(0, 10)}`;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (request.headers.get(HEADER_KEY_NAME) !== env.RELAY_HEADER_KEY) {
      return new Response("Unauthorized", { status: 401 });
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const { success: withinIpLimit } = await env.RATE_LIMITER.limit({ key: ip });
    if (!withinIpLimit) {
      return new Response("Rate limited", { status: 429 });
    }

    // Accepted tradeoff: KV read-then-write is not atomic, so this is a soft cap that concurrent requests can slightly overshoot; acceptable at this traffic level.
    const dailyCap = Number(env.DAILY_CAP);
    const cacheKey = todayKey();
    const currentCountRaw = await env.DAILY_CAP_KV.get(cacheKey);
    const currentCount = currentCountRaw ? Number(currentCountRaw) : 0;
    if (currentCount >= dailyCap) {
      return new Response("Daily cap reached", { status: 429 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return new Response("Malformed JSON", { status: 400 });
    }

    const payload = validatePayload(json);
    if (!payload) {
      return new Response("Payload does not match the fixed schema", { status: 400 });
    }

    let result;
    try {
      result = await createGitHubIssue(payload, env.GITHUB_REPO, env.GITHUB_PAT);
    } catch {
      return new Response("Upstream GitHub error", { status: 502 });
    }
    if (!result.ok) {
      return new Response("Upstream GitHub error", { status: 502 });
    }

    await env.DAILY_CAP_KV.put(cacheKey, String(currentCount + 1), { expirationTtl: DAILY_CAP_TTL_SECONDS });

    return new Response("ok", { status: 201 });
  },
};
