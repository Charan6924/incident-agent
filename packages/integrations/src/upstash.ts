import { Client as UpstashKafka } from "@upstash/kafka";
import type { IncidentEvent } from "@incident-agent/shared";

/**
 * Create an Upstash Kafka client for publishing incident events.
 *
 * Requires env vars: UPSTASH_KAFKA_URL, UPSTASH_KAFKA_USERNAME, UPSTASH_KAFKA_PASSWORD, KAFKA_ALERTS_TOPIC.
 */
export function createKafkaClient() {
    const kafka = new UpstashKafka({
        url : process.env.UPSTASH_KAFKA_URL!,
        username : process.env.UPSTASH_KAFKA_USERNAME!,
        password : process.env.UPSTASH_KAFKA_PASSWORD!
    });

    const producer = kafka.producer()
    const topic = process.env.KAFKA_ALERTS_TOPIC!;

    return{
        publish: async (event: IncidentEvent) => {
            await producer.produce(topic, {
                key: String(event.id),
                value: JSON.stringify(event),
            });
        },
    }
}
