import { Resolver } from '@nestjs/graphql';
import { RetrievalService } from './retrieval.service';

@Resolver()
export class RetrievalResolver {
  constructor(private readonly retrievalService: RetrievalService) {}
}
