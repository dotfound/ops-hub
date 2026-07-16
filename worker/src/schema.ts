// worker/src/schema.ts
export const CATEGORIES = [
  "bug",
  "connector-limitation",
  "user-correction",
  "missing-check",
  "suggestion",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;

export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export interface RelayPayload {
  skill: string;
  skillVersion: string;
  category: Category;
  directive: string;
  confidence: Confidence;
}

const MAX_SKILL_NAME_LENGTH = 60;
const MAX_VERSION_LENGTH = 60;
const MAX_DIRECTIVE_LENGTH = 500;

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

export function validatePayload(body: unknown): RelayPayload | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.skill, MAX_SKILL_NAME_LENGTH)) return null;
  if (!isNonEmptyString(b.skillVersion, MAX_VERSION_LENGTH)) return null;
  if (!isNonEmptyString(b.directive, MAX_DIRECTIVE_LENGTH)) return null;
  if (typeof b.category !== "string" || !CATEGORIES.includes(b.category as Category)) return null;
  if (typeof b.confidence !== "string" || !CONFIDENCE_LEVELS.includes(b.confidence as Confidence)) return null;

  return {
    skill: b.skill as string,
    skillVersion: b.skillVersion as string,
    category: b.category as Category,
    directive: b.directive as string,
    confidence: b.confidence as Confidence,
  };
}
