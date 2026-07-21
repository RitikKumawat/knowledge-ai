import { Test, TestingModule } from '@nestjs/testing';
import { RetrievalResolver } from './retrieval.resolver';
import { RetrievalService } from './retrieval.service';

describe('RetrievalResolver', () => {
  let resolver: RetrievalResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RetrievalResolver, RetrievalService],
    }).compile();

    resolver = module.get<RetrievalResolver>(RetrievalResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
