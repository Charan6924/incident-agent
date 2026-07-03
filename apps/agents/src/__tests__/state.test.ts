import { describe, it, expect } from "vitest";
import { IncidentAnnotation } from "../state";

describe("IncidentAnnotation", () => {
  it("is defined and can be used in graphs", () => {
    expect(IncidentAnnotation).toBeDefined();
  });
});
