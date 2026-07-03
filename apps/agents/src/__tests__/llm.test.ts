import { describe, it, expect, beforeEach } from "vitest";
import { llm } from "../llm";

beforeEach(() => {
  process.env.DEEPSEEK_API_KEY = "sk-test-key";
});

describe("LLM configuration", () => {
  it("uses deepseek-v4-flash model", () => {
    expect(llm.model).toBe("deepseek-v4-flash");
  });

  it("points to DeepSeek base URL", () => {
    const config = (llm as any).clientConfig;
    expect(config.baseURL).toBe("https://api.deepseek.com");
  });
});
