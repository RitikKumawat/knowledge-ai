import { Injectable } from '@nestjs/common';
import ollama from 'ollama';
import { InferenceClient } from '@huggingface/inference';

@Injectable()
export class EmbeddingsService {
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly hf: InferenceClient | null = null;

  constructor() {
    if (this.isProduction) {
      this.hf = new InferenceClient(process.env.HF_TOKEN);
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
        const response = await this.hf!.featureExtraction({
          model: 'sentence-transformers/all-mpnet-base-v2',
          inputs: chunk,
        });

        const arr = response as number[] | number[][] | number[][][];
        if (!arr || arr.length === 0) {
          throw new Error('No embeddings returned from Hugging Face');
        }

        if (Array.isArray(arr[0])) {
          return arr[0] as number[];
        }
        return arr as number[];
      } catch (error) {
        throw new Error('Failed to generate embeddings using Hugging Face', {
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
            const response = await this.hf!.featureExtraction({
              model: 'sentence-transformers/all-mpnet-base-v2',
              inputs: batch,
            });

            // HuggingFace returns number[][] for array of strings
            const embeddings = response as number[][];
            allEmbeddings.push(...embeddings);
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
                `Hugging Face API rate limited (429). Retrying in 5 seconds... (${retries} retries left)`,
              );
              await new Promise((resolve) => setTimeout(resolve, 5000));
            } else {
              throw error;
            }
          }
        }

        // Delay between batches to respect Hugging Face free tier limits
        if (i + batchSize < chunks.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      return allEmbeddings;
    } catch (error) {
      throw new Error('Failed to generate embeddings using Hugging Face', {
        cause: error,
      });
    }
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
