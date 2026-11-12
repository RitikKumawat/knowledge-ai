import { Injectable } from '@nestjs/common';
import ollama from 'ollama';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class EmbeddingsService {
  private static readonly GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';
  private static readonly EMBEDDING_DIMENSIONS = 768;

  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly ai: GoogleGenAI | null = null;

  constructor() {
    if (this.isProduction) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(
          'GEMINI_API_KEY is required when NODE_ENV is production',
        );
      }
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async generateEmbeddings(chunks: string[]): Promise<number[][]> {
    return this.isProduction
      ? this.generateCloudEmbeddings(chunks)
      : this.generateOllamaEmbeddings(chunks);
  }

  async generateEmbeddingsForSingleChunk(chunk: string): Promise<number[]> {
    if (this.isProduction) {
      try {
        const response = await this.ai!.models.embedContent({
          model: EmbeddingsService.GEMINI_EMBEDDING_MODEL,
          contents: chunk,
          config: {
            taskType: 'RETRIEVAL_QUERY',
            outputDimensionality: EmbeddingsService.EMBEDDING_DIMENSIONS,
          },
        });

        const values = response.embeddings?.[0]?.values;
        if (!values || values.length === 0) {
          throw new Error('No embeddings returned from Gemini API');
        }

        return this.normalizeVector(values);
      } catch (error) {
        throw new Error('Failed to generate embeddings using Gemini API', {
          cause: error,
        });
      }
    } else {
      try {
        const response = await ollama.embed({
          model: 'nomic-embed-text',
          input: [chunk],
          truncate: false,
        });
        return response.embeddings[0];
      } catch (error) {
        this.handleOllamaError(error);
      }
    }
  }

  private async generateCloudEmbeddings(chunks: string[]): Promise<number[][]> {
    try {
      const allEmbeddings: number[][] = [];
      const batchSize = 32;

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        let retries = 3;
        let success = false;

        while (retries > 0 && !success) {
          try {
            const response = await this.ai!.models.embedContent({
              model: EmbeddingsService.GEMINI_EMBEDDING_MODEL,
              contents: batch,
              config: {
                taskType: 'RETRIEVAL_DOCUMENT',
                outputDimensionality: EmbeddingsService.EMBEDDING_DIMENSIONS,
              },
            });

            const embeddings = response.embeddings ?? [];
            if (embeddings.length !== batch.length) {
              throw new Error(
                `Expected ${batch.length} embeddings from Gemini API, got ${embeddings.length}`,
              );
            }

            for (const item of embeddings) {
              if (!item.values || item.values.length === 0) {
                throw new Error(
                  'Empty embedding vector returned from Gemini API',
                );
              }
              allEmbeddings.push(this.normalizeVector(item.values));
            }
            success = true;
          } catch (error: unknown) {
            const isRateLimit =
              typeof error === 'object' &&
              error !== null &&
              'status' in error &&
              error.status === 429;

            if (isRateLimit) {
              retries--;
              if (retries === 0) throw error;
              console.warn(
                `Gemini API rate limited (429). Retrying in 5 seconds... (${retries} retries left)`,
              );
              await new Promise((resolve) => setTimeout(resolve, 5000));
            } else {
              throw error;
            }
          }
        }

        // Delay between batches to respect Gemini free tier RPM limits
        if (i + batchSize < chunks.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      return allEmbeddings;
    } catch (error) {
      throw new Error('Failed to generate embeddings using Gemini API', {
        cause: error,
      });
    }
  }

  private normalizeVector(values: number[]): number[] {
    const norm = Math.sqrt(values.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return values;
    return values.map((val) => val / norm);
  }

  private async generateOllamaEmbeddings(
    chunks: string[],
  ): Promise<number[][]> {
    try {
      const allEmbeddings: number[][] = [];
      const batchSize = 10;

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const response = await ollama.embed({
          model: 'nomic-embed-text',
          input: batch,
          truncate: true,
        });
        allEmbeddings.push(...response.embeddings);
      }

      return allEmbeddings;
    } catch (error) {
      this.handleOllamaError(error);
    }
  }

  private handleOllamaError(error: unknown): never {
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

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(String(error));
  }
}
