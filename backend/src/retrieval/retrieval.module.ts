import { Module } from '@nestjs/common';
import { RetrievalService } from './retrieval.service';
import { RetrievalResolver } from './retrieval.resolver';

@Module({
  providers: [RetrievalResolver, RetrievalService],
  exports: [RetrievalService],
})
export class RetrievalModule {}
