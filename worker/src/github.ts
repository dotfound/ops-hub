// worker/src/github.ts
import type { RelayPayload } from "./schema";

const GITHUB_API_VERSION = "2022-11-28";
const TITLE_SUMMARY_MAX = 80;

export interface GitHubIssueResult {
  ok: boolean;
  status: number;
}

function buildTitle(payload: RelayPayload): string {
  const summary =
    payload.directive.length > TITLE_SUMMARY_MAX
      ? `${payload.directive.slice(0, TITLE_SUMMARY_MAX - 3)}...`
      : payload.directive;
  return `[${payload.category}] ${payload.skill}: ${summary}`;
}

function buildBody(payload: RelayPayload): string {
  return [
    payload.directive,
    "",
    `**Skill version:** \`${payload.skillVersion}\``,
    `**Confidence (generalizability):** ${payload.confidence}`,
  ].join("\n");
}

export async function createGitHubIssue(
  payload: RelayPayload,
  repo: string,
  pat: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GitHubIssueResult> {
  const response = await fetchImpl(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      "Content-Type": "application/json",
      "User-Agent": "ops-hub-learning-loop-relay",
    },
    body: JSON.stringify({
      title: buildTitle(payload),
      body: buildBody(payload),
      labels: [payload.category],
    }),
  });

  return { ok: response.ok, status: response.status };
}
