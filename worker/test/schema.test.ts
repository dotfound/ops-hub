// worker/test/schema.test.ts
import { describe, it, expect } from "vitest";
import { validatePayload, CATEGORIES, CONFIDENCE_LEVELS } from "../src/schema";

const validPayload = {
  skill: "client-update",
  skillVersion: "a1b2c3d",
  category: "connector-limitation",
  directive: "Notion query_data_sources is gated; use notion-search instead.",
  confidence: "high",
};

describe("validatePayload", () => {
  it("accepts a well-formed payload", () => {
    const result = validatePayload(validPayload);
    expect(result).not.toBeNull();
    expect(result?.skill).toBe("client-update");
  });

  it("rejects a category not in the fixed list", () => {
    const result = validatePayload({ ...validPayload, category: "feature-request" });
    expect(result).toBeNull();
  });

  it("rejects a confidence value outside the fixed list", () => {
    const result = validatePayload({ ...validPayload, confidence: "certain" });
    expect(result).toBeNull();
  });

  it("rejects a directive over the max length", () => {
    const result = validatePayload({ ...validPayload, directive: "x".repeat(501) });
    expect(result).toBeNull();
  });

  it("rejects a payload missing a required field", () => {
    const { skillVersion, ...withoutVersion } = validPayload;
    const result = validatePayload(withoutVersion);
    expect(result).toBeNull();
  });

  it("rejects a non-object body", () => {
    expect(validatePayload("not an object")).toBeNull();
    expect(validatePayload(null)).toBeNull();
    expect(validatePayload([1, 2, 3])).toBeNull();
  });

  it("exposes exactly the 5 agreed categories", () => {
    expect(CATEGORIES).toEqual([
      "bug",
      "connector-limitation",
      "user-correction",
      "missing-check",
      "suggestion",
    ]);
  });

  it("exposes exactly the 3 agreed confidence levels", () => {
    expect(CONFIDENCE_LEVELS).toEqual(["high", "medium", "low"]);
  });
});
