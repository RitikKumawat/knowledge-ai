import { Injectable } from '@nestjs/common';
import { ChromaClient, IncludeEnum } from 'chromadb';

export interface RetrievedChunk {
  chunk: string;
  similarity: number;
  documentId: string;
}

@Injectable()
export class RetrievalService {
  private readonly chromaClient = new ChromaClient({
    path: process.env.CHROMA_URL || 'http://localhost:8000',
  });

  async searchChunks(
    queryEmbedding: number[],
    documentIds: string[],
    k: number = 5,
  ): Promise<RetrievedChunk[]> {
    const collection = await this.chromaClient.getOrCreateCollection({
      name: 'documents',
      embeddingFunction: null,
    });

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: k,
      where: {
        documentId: {
          $in: documentIds,
        },
      },
      include: [
        IncludeEnum.documents,
        IncludeEnum.metadatas,
        IncludeEnum.distances,
      ],
    });

    if (!results.documents[0] || !results.distances || !results.distances[0]) {
      return [];
    }

    const retrieved: RetrievedChunk[] = [];
    const docs = results.documents[0];
    const dists = results.distances[0];
    const metas = results.metadatas[0];

    for (let i = 0; i < docs.length; i++) {
      if (docs[i] !== null && metas[i]) {
        const metadata = metas[i] as Record<string, unknown>;
        retrieved.push({
          chunk: docs[i] as string,
          similarity: dists[i] ?? 0,
          documentId: metadata.documentId as string,
        });
      }
    }

    return retrieved;
  }
}
