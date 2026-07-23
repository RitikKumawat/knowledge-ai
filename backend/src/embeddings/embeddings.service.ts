import { Injectable } from '@nestjs/common';
import ollama from 'ollama';

@Injectable()
export class EmbeddingsService {
  async generateEmbeddings(chunks: string[]): Promise<number[][]> {
    try {
      const allEmbeddings: number[][] = [];
      const batchSize = 10;

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const response = await ollama.embed({
          model: 'nomic-embed-text',
          input: batch,
          truncate: true, // Safe fallback
        });
        allEmbeddings.push(...response.embeddings);
      }

      return allEmbeddings;
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message === 'fetch failed' &&
        error.cause instanceof Error &&
        'code' in error.cause &&
        error.cause.code === 'ECONNREFUSED'
      ) {
        throw new Error(
          'Ollama is not reachable at 127.0.0.1:11434. Start Ollama and make sure the nomic-embed-text model is pulled.',
          { cause: error },
        );
      }

      if (
        error instanceof Error &&
        error.message.includes('input length exceeds the context length')
      ) {
        throw new Error(
          'A document chunk is still too large for the Ollama embedding model. Reduce the chunk size in DocumentsProcessor.',
          { cause: error },
        );
      }

      throw error;
    }
  }
  async generateEmbeddingsForSingleChunk(chunk: string): Promise<number[]> {
    try {
      const response = await ollama.embed({
        model: 'nomic-embed-text',
        input: [chunk],
        truncate: false,
      });
      return response.embeddings[0];
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message === 'fetch failed' &&
        error.cause instanceof Error &&
        'code' in error.cause &&
        error.cause.code === 'ECONNREFUSED'
      ) {
        throw new Error(
          'Ollama is not reachable at 127.0.0.1:11434. Start Ollama and make sure the nomic-embed-text model is pulled.',
          { cause: error },
        );
      }

      if (
        error instanceof Error &&
        error.message.includes('input length exceeds the context length')
      ) {
        throw new Error(
          'A document chunk is still too large for the Ollama embedding model. Reduce the chunk size in DocumentsProcessor.',
          { cause: error },
        );
      }

      throw error;
    }
  }
}
