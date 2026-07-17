// worker/test/github.test.ts
import { describe, it, expect, vi } from "vitest";
import { createGitHubIssue } from "../src/github";
import type { RelayPayload } from "../src/schema";

const samplePayload: RelayPayload = {
  skill: "client-update",
  skillVersion: "a1b2c3d",
  category: "connector-limitation",
  directive: "Notion query_data_sources is gated; use notion-search instead.",
  confidence: "high",
};

describe("createGitHubIssue", () => {
  it("posts to the repo's issues endpoint with the category as a label", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    const result = await createGitHubIssue(samplePayload, "dotfound/ops-hub", "fake-pat", fetchMock);

    expect(result.ok).toBe(true);
    expect(result.status).toBe(201);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.github.com/repos/dotfound/ops-hub/issues");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer fake-pat");
    expect(options.headers["X-GitHub-Api-Version"]).toBe("2022-11-28");

    const body = JSON.parse(options.body as string);
    expect(body.labels).toEqual(["connector-limitation"]);
    expect(body.title).toBe(
      "[connector-limitation] client-update: Notion query_data_sources is gated; use notion-search instead.",
    );
    expect(body.body).toContain(samplePayload.directive);
    expect(body.body).toContain("a1b2c3d");
    expect(body.body).toContain("high");
  });

  it("truncates a long directive in the title but keeps it in full in the body", async () => {
    const longDirective = "x".repeat(120);
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    await createGitHubIssue({ ...samplePayload, directive: longDirective }, "dotfound/ops-hub", "fake-pat", fetchMock);

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body.title.length).toBeLessThan(120);
    expect(body.body).toContain(longDirective);
  });

  it("reports failure when GitHub responds with an error status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
    const result = await createGitHubIssue(samplePayload, "dotfound/ops-hub", "fake-pat", fetchMock);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });
});
