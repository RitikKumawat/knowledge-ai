import { Module } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { EmbeddingsResolver } from './embeddings.resolver';

@Module({
  providers: [EmbeddingsResolver, EmbeddingsService],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
