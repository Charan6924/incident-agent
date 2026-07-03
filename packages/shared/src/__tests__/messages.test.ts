import { describe, it, expect } from "vitest";
import type { SlackMessage, KafkaMessage } from "../types";

describe("SlackMessage", () => {
  it("can be created with channel and text", () => {
    const msg: SlackMessage = { channel: "#incidents", text: "P1 alert" };
    expect(msg.channel).toBe("#incidents");
    expect(msg.text).toContain("alert");
  });

  it("accepts optional blocks", () => {
    const msg: SlackMessage = {
      channel: "#incidents",
      text: "P1 alert",
      blocks: [{ type: "section", text: { type: "mrkdwn", text: "hello" } }],
    };
    expect(msg.blocks).toHaveLength(1);
  });
});

describe("KafkaMessage", () => {
  it("can be created with topic and value", () => {
    const msg: KafkaMessage = { topic: "alerts", value: { id: 1 } };
    expect(msg.topic).toBe("alerts");
    expect(msg.value).toEqual({ id: 1 });
  });

  it("accepts optional key", () => {
    const msg: KafkaMessage = { topic: "alerts", key: "incident-1", value: {} };
    expect(msg.key).toBe("incident-1");
  });

  it("value can be any type", () => {
    const str: KafkaMessage = { topic: "t", value: "string" };
    const arr: KafkaMessage = { topic: "t", value: [1, 2, 3] };
    expect(typeof str.value).toBe("string");
    expect(Array.isArray(arr.value)).toBe(true);
  });
});
