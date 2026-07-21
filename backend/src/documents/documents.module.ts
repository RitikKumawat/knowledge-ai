import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsResolver } from './documents.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { SCHEMAS } from '../schemas/index.schemas';
import { BullModule } from '@nestjs/bull';
import { DocumentsProcessor } from './documents.processor';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [
    MongooseModule.forFeature(SCHEMAS),
    BullModule.registerQueue({
      name: 'document-processing',
    }),
    EmbeddingsModule,
  ],
  providers: [DocumentsResolver, DocumentsService, DocumentsProcessor],
})
export class DocumentsModule {}
