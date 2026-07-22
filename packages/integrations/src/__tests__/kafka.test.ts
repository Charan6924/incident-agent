import { describe, it, expect, beforeEach, vi } from "vitest";
import { createKafkaClient } from "../upstash";
import type { IncidentEvent } from "@incident-agent/shared";
import { Severity } from "@incident-agent/shared";

const mockProduce = vi.fn();
const mockProducer = { produce: mockProduce };

vi.mock("@upstash/kafka", () => ({
  Kafka: class {
    producer() {
      return mockProducer;
    }
  },
}));

const event: IncidentEvent = {
  id: 42,
  source: "prometheus",
  title: "CPU spike",
  message: "CPU > 90%",
  severity: Severity.P1,
  service: "api-gateway",
  timestamp: "2025-01-01T00:00:00.000Z",
};

beforeEach(() => {
  process.env.UPSTASH_KAFKA_URL = "https://kafka.example.com";
  process.env.UPSTASH_KAFKA_USERNAME = "user";
  process.env.UPSTASH_KAFKA_PASSWORD = "pass";
  process.env.KAFKA_ALERTS_TOPIC = "incident-alerts";
  vi.clearAllMocks();
});

describe("Kafka client", () => {
  it("publishes event to the configured topic", async () => {
    mockProduce.mockResolvedValue(undefined);

    const client = createKafkaClient();
    await client.publish(event);

    expect(mockProduce).toHaveBeenCalledWith("incident-alerts", {
      key: "42",
      value: JSON.stringify(event),
    });
  });

  it("stringifies event id as key", async () => {
    mockProduce.mockResolvedValue(undefined);

    const small: IncidentEvent = { ...event, id: 7 };
    const client = createKafkaClient();
    await client.publish(small);

    expect(mockProduce).toHaveBeenCalledWith(
      "incident-alerts",
      expect.objectContaining({ key: "7" }),
    );
  });
});
