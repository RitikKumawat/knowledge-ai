import { Resolver } from '@nestjs/graphql';
import { EmbeddingsService } from './embeddings.service';

@Resolver()
export class EmbeddingsResolver {
  constructor(private readonly embeddingsService: EmbeddingsService) {}
}
