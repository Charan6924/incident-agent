import { QdrantClient } from "@qdrant/js-client-rest";

const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";
const COLLECTION_NAME = "incident_memory";

export const qdrant = new QdrantClient({ url: QDRANT_URL });

export async function ensureCollection(): Promise<void> {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === COLLECTION_NAME,
  );
  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: { size: 1536, distance: "Cosine" },
    });
  }
}

export async function storeIncident(
  id: string,
  embedding: number[],
  payload: Record<string, unknown>,
): Promise<void> {
  await qdrant.upsert(COLLECTION_NAME, {
    points: [{ id, vector: embedding, payload }],
  });
}

export async function searchSimilar(
  embedding: number[],
  limit = 5,
): Promise<{ id: string; score: number; payload: Record<string, unknown> }[]> {
  const result = await qdrant.search(COLLECTION_NAME, {
    vector: embedding,
    limit,
    with_payload: true,
  });
  return result.map((r) => ({
    id: String(r.id),
    score: r.score ?? 0,
    payload: (r.payload ?? {}) as Record<string, unknown>,
  }));
}
