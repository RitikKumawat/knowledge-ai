import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingsResolver } from './embeddings.resolver';
import { EmbeddingsService } from './embeddings.service';

describe('EmbeddingsResolver', () => {
  let resolver: EmbeddingsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmbeddingsResolver, EmbeddingsService],
    }).compile();

    resolver = module.get<EmbeddingsResolver>(EmbeddingsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
