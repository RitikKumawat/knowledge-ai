import { Injectable } from '@nestjs/common';
import {
  VectorDbService,
  RetrievedChunk,
} from '../vector-db/vector-db.service';

export type { RetrievedChunk };

@Injectable()
export class RetrievalService {
  constructor(private readonly vectorDbService: VectorDbService) {}

  async searchChunks(
    queryEmbedding: number[],
    documentIds: string[],
    k: number = 5,
  ): Promise<RetrievedChunk[]> {
    return this.vectorDbService.queryChunks(queryEmbedding, documentIds, k);
  }
}
