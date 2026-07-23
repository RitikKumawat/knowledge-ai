import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import {
  UploadedDoc,
  UploadedDocDocument,
} from '../schemas/uploadedDoc.schema';
import {
  DocumentChunk,
  DocumentChunkDocument,
} from '../schemas/documentChunk.schema';
import { Model } from 'mongoose';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { PDFParse } from 'pdf-parse';
import { ChromaClient } from 'chromadb';
import { EmbeddingsService } from '../embeddings/embeddings.service';

export interface ProcessJobData {
  documentId: string;
  fileUrl: string;
}

@Processor('document-processing')
export class DocumentsProcessor {
  private readonly chromaClient = new ChromaClient({
    path: process.env.CHROMA_URL || 'http://localhost:8000',
  });

  constructor(
    @InjectModel(UploadedDoc.name)
    private readonly uploadedDocModel: Model<UploadedDocDocument>,
    @InjectModel(DocumentChunk.name)
    private readonly documentChunkModel: Model<DocumentChunkDocument>,
    private readonly embeddingsService: EmbeddingsService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  @Process('process')
  async handleProcessing(job: Job<ProcessJobData>) {
    const { documentId, fileUrl } = job.data;

    // Fetch the document
    const doc = await this.uploadedDocModel.findById(documentId);
    if (!doc) {
      console.error(`Document not found: ${documentId}`);
      return;
    }

    doc.status = 'PROCESSING';
    await doc.save();
    this.pubSub.publish('documentStatusUpdated', {
      documentStatusUpdated: doc,
    });

    try {
      // Extract the filename from the URL
      const filename = fileUrl.split('/').pop();
      const filePath = join(process.cwd(), 'uploads', filename ?? '');
      // Read the file
      const dataBuffer = readFileSync(filePath);

      let textContent = '';
      let pagesCount = 1;

      // Check if PDF by extension
      if (filename?.toLowerCase().endsWith('.pdf')) {
        const parser = new PDFParse({ data: dataBuffer });
        try {
          const data = await parser.getText();
          textContent = data.text;
          pagesCount = data.total || 1;
        } finally {
          await parser.destroy();
        }
      } else {
        textContent = dataBuffer.toString('utf-8');
      }

      // Chunk the text into words with overlap
      const chunks = this.chunkText(textContent, 250, 25);
      const chunksCount = chunks.length;

      if (chunksCount > 0) {
        // Ensure collection exists
        const collectionName = 'documents';
        const collection = await this.chromaClient.getOrCreateCollection({
          name: collectionName,
          embeddingFunction: null,
        });

        // Delete existing chunks if reprocessing
        await collection.delete({
          where: {
            documentId,
          },
        });
        await this.documentChunkModel.deleteMany({ documentId });

        // Generate embeddings and store in ChromaDB
        const ids = chunks.map((_, i) => `${documentId}-chunk-${i}`);
        const metadatas = chunks.map((_, i) => ({
          documentId,
          chunkIndex: i,
          filename: doc.filename,
          uploadedBy: doc.uploadedBy.toString(),
        }));

        const embeddings =
          await this.embeddingsService.generateEmbeddings(chunks);

        // Upsert into chromadb
        await collection.upsert({
          ids,
          embeddings,
          metadatas,
          documents: chunks,
        });

        // Save chunks to MongoDB
        const documentChunks = chunks.map((content, i) => ({
          documentId: doc._id,
          chunkIndex: i,
          content,
          embeddingId: ids[i],
        }));
        await this.documentChunkModel.insertMany(documentChunks);
      }

      // Update the document in MongoDB
      doc.status = 'COMPLETED';
      doc.pages = pagesCount;
      doc.chunksCount = chunksCount;
      await doc.save();
      this.pubSub.publish('documentStatusUpdated', {
        documentStatusUpdated: doc,
      });

      console.log(`Successfully processed document ${documentId}`);
    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      doc.status = 'FAILED';
      doc.errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await doc.save();
      this.pubSub.publish('documentStatusUpdated', {
        documentStatusUpdated: doc,
      });
      throw error;
    }
  }

  private chunkText(
    text: string,
    chunkSize: number = 250,
    overlap: number = 25,
  ): string[] {
    const chunks: string[] = [];
    const words = text.replace(/\s+/g, ' ').trim().split(' ');

    if (words.length === 0 || words[0] === '') return [];

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunkWords = words.slice(i, i + chunkSize);
      chunks.push(chunkWords.join(' '));
      if (i + chunkSize >= words.length) {
        break;
      }
    }

    return chunks;
  }
}
