import { describe, it, expect } from "vitest";
import { Severity } from "../types";

describe("Severity", () => {
  it("has five levels", () => {
    expect(Object.keys(Severity)).toHaveLength(5);
  });

  it("P0 is critical", () => {
    expect(Severity.P0).toBe("P0");
  });

  it("P1 is high", () => {
    expect(Severity.P1).toBe("P1");
  });

  it("P2 is medium", () => {
    expect(Severity.P2).toBe("P2");
  });

  it("P3 is low", () => {
    expect(Severity.P3).toBe("P3");
  });

  it("P4 is informational", () => {
    expect(Severity.P4).toBe("P4");
  });

  it("all values match their keys", () => {
    for (const key of Object.keys(Severity)) {
      expect(Severity[key as keyof typeof Severity]).toBe(key);
    }
  });
});
