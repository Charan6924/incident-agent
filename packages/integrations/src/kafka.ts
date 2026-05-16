import type { AlertEvent } from "@incident-agent/shared";

const KAFKA_BROKER = process.env.KAFKA_BROKER ?? "localhost:9092";

export async function publishAlert(event: AlertEvent): Promise<void> {
  // Stub — will wire up Kafka producer when running
  console.log(`[kafka] published to alerts topic: ${event.service}`);
}

export async function subscribeAlerts(
  handler: (event: AlertEvent) => Promise<void>,
): Promise<void> {
  // Stub — will wire up Kafka consumer when running
  console.log(`[kafka] subscribed to alerts topic`);
}
