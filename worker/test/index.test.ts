// worker/test/index.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import worker from "../src/index";

const validBody = {
  skill: "client-update",
  skillVersion: "a1b2c3d",
  category: "connector-limitation",
  directive: "Notion query_data_sources is gated; use notion-search instead.",
  confidence: "high",
};

function makeRequest(body: unknown, headers: Record<string, string> = {}, method = "POST") {
  return new Request("https://relay.example.com/", {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Relay-Key": "test-key",
      ...headers,
    },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
}

describe("worker fetch handler", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 201 })));
  });

  it("rejects non-POST methods", async () => {
    const request = makeRequest(undefined, {}, "GET");
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(405);
  });

  it("rejects a request with the wrong header key", async () => {
    const request = makeRequest(validBody, { "X-Relay-Key": "wrong" });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(401);
  });

  it("rejects malformed JSON", async () => {
    const request = new Request("https://relay.example.com/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Relay-Key": "test-key" },
      body: "{not json",
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(400);
  });

  it("rejects a payload that fails schema validation", async () => {
    const request = makeRequest({ skill: "client-update" });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(400);
  });

  it("accepts a valid payload and creates a GitHub issue", async () => {
    const request = makeRequest(validBody);
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(201);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/dotfound/ops-hub/issues",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns 502 when the GitHub call fails and does not increment the daily cap", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
    const todayKey = `issue-count:${new Date().toISOString().slice(0, 10)}`;
    const countBefore = await env.DAILY_CAP_KV.get(todayKey);
    const request = makeRequest(validBody);
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(502);
    expect(await env.DAILY_CAP_KV.get(todayKey)).toBe(countBefore);
  });

  it("returns 502 when the GitHub call throws (network failure)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const request = makeRequest(validBody);
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(502);
  });

  it("enforces the per-IP rate limit after repeated requests", async () => {
    let lastStatus = 200;
    for (let i = 0; i < 15; i++) {
      const request = makeRequest(validBody, { "CF-Connecting-IP": "203.0.113.9" });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      lastStatus = response.status;
    }
    expect(lastStatus).toBe(429);
  });
});
