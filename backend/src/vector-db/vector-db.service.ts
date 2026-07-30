import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChromaClient, IncludeEnum } from 'chromadb';
import { Index } from '@upstash/vector';

export interface RetrievedChunk {
  chunk: string;
  similarity: number;
  documentId: string;
}

@Injectable()
export class VectorDbService implements OnModuleInit {
  private chromaClient: ChromaClient | null = null;
  private upstashIndex: Index | null = null;
  private readonly isProduction = process.env.NODE_ENV === 'production';

  onModuleInit() {
    if (this.isProduction) {
      this.upstashIndex = new Index({
        url: process.env.UPSTASH_VECTOR_REST_URL as string,
        token: process.env.UPSTASH_VECTOR_REST_TOKEN as string,
      });
    } else {
      this.chromaClient = new ChromaClient({
        path: process.env.CHROMA_URL || 'http://localhost:8000',
      });
    }
  }

  async deleteByDocumentId(
    documentId: string,
    chunksCount: number,
  ): Promise<void> {
    if (this.isProduction) {
      if (chunksCount > 0) {
        const ids = Array.from(
          { length: chunksCount },
          (_, i) => `${documentId}-chunk-${i}`,
        );
        for (let i = 0; i < ids.length; i += 1000) {
          await this.upstashIndex!.delete(ids.slice(i, i + 1000));
        }
      }
    } else {
      const collection = await this.chromaClient!.getOrCreateCollection({
        name: 'documents',
        embeddingFunction: null,
      });
      await collection.delete({ where: { documentId } });
    }
  }

  async upsertChunks(
    documentId: string,
    chunks: string[],
    embeddings: number[][],
    metadatas: Record<string, string | number | boolean>[],
  ): Promise<void> {
    const ids = chunks.map((_, i) => `${documentId}-chunk-${i}`);

    if (this.isProduction) {
      const vectors = ids.map((id, i) => ({
        id,
        vector: embeddings[i],
        metadata: { ...metadatas[i], chunk: chunks[i] },
      }));
      for (let i = 0; i < vectors.length; i += 100) {
        await this.upstashIndex!.upsert(vectors.slice(i, i + 100));
      }
    } else {
      const collection = await this.chromaClient!.getOrCreateCollection({
        name: 'documents',
        embeddingFunction: null,
      });
      await collection.upsert({
        ids,
        embeddings,
        metadatas,
        documents: chunks,
      });
    }
  }

  async queryChunks(
    queryEmbedding: number[],
    documentIds: string[],
    k: number = 5,
  ): Promise<RetrievedChunk[]> {
    if (this.isProduction) {
      let filter = '';
      if (documentIds.length > 0) {
        const formattedIds = documentIds.map((id) => "'" + id + "'").join(', ');
        filter = `documentId IN (${formattedIds})`;
      }
      const results = await this.upstashIndex!.query({
        vector: queryEmbedding,
        topK: k,
        includeMetadata: true,
        filter: filter || undefined,
      });

      return results.map((res) => ({
        chunk: (res.metadata?.chunk as string) || '',
        similarity: res.score,
        documentId: (res.metadata?.documentId as string) || '',
      }));
    } else {
      const collection = await this.chromaClient!.getOrCreateCollection({
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

      if (!results?.documents[0] || !results?.distances[0]) {
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
}
