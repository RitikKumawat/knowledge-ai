import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  UploadedDoc,
  UploadedDocDocument,
} from '../schemas/uploadedDoc.schema';
import { Model, Types } from 'mongoose';
import type { FileUpload } from 'graphql-upload-ts';
import { UserDocument } from '../schemas/users.schema';
import { generateFileUrl } from '../util/generateFileUrl';
import { Request } from 'express';
import { validateFile } from '../util/validateFile.util';
import {
  DocumentChunk,
  DocumentChunkDocument,
} from '../schemas/documentChunk.schema';
import {
  ChatSession,
  ChatSessionDocument,
} from '../schemas/chatSessions.schema';
import { ChromaClient } from 'chromadb';
import { basename, join } from 'node:path';
import { unlink } from 'node:fs/promises';

import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class DocumentsService {
  private readonly chromaClient = new ChromaClient({
    path: process.env.CHROMA_URL || 'http://localhost:8000',
  });

  constructor(
    @InjectModel(UploadedDoc.name)
    private readonly uploadedDocModel: Model<UploadedDocDocument>,
    @InjectQueue('document-processing')
    private readonly documentProcessingQueue: Queue,
    @InjectModel(DocumentChunk.name)
    private readonly documentChunkModel: Model<DocumentChunkDocument>,
    @InjectModel(ChatSession.name)
    private readonly chatSessionModel: Model<ChatSessionDocument>,
  ) {}

  async uploadDocument(
    file: FileUpload,
    user: UserDocument,
    req: Request,
  ): Promise<string> {
    if (!file) {
      throw new Error('File is required');
    }

    await validateFile(file, {
      allowedMimeTypes: ['application/pdf', 'application/octet-stream'],
      maxSizeInBytes: 5 * 1024 * 1024, // 5 MB
    });

    const fileUrl = generateFileUrl(req, file, '');
    const newDoc = await this.uploadedDocModel.create({
      filename: file.filename,
      fileUrl: fileUrl,
      pages: 0,
      chunksCount: 0,
      status: 'PENDING',
      uploadedBy: user._id,
    });

    // Queue the background job for processing (fire and forget)
    this.documentProcessingQueue
      .add('process', {
        documentId: newDoc._id.toString(),
        fileUrl: newDoc.fileUrl,
      })
      .catch((err) => {
        console.error('Failed to add document to processing queue:', err);
      });

    return 'Document uploaded successfully';
  }

  async listDocuments(
    user: UserDocument,
    pagination?: { page: number; limit: number },
  ) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const query = { uploadedBy: user._id };
    const [items, totalCount] = await Promise.all([
      this.uploadedDocModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.uploadedDocModel.countDocuments(query),
    ]);

    return {
      items,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async getDocumentDetails(
    id: Types.ObjectId,
    user: UserDocument,
  ): Promise<UploadedDocDocument> {
    const document = await this.uploadedDocModel.findById(id);
    if (!document) throw new NotFoundException('Document not found');

    if (document.uploadedBy.toString() !== user._id.toString()) {
      throw new ForbiddenException(
        'You do not have permission to access this document',
      );
    }

    return document;
  }

  async deleteDocument(
    id: Types.ObjectId,
    user: UserDocument,
  ): Promise<boolean> {
    const document = await this.getDocumentDetails(id, user);
    const documentId = id.toString();
    const collection = await this.chromaClient.getOrCreateCollection({
      name: 'documents',
      embeddingFunction: null,
    });

    await collection.delete({ where: { documentId } });
    await this.documentChunkModel.deleteMany({ documentId: id });
    await this.chatSessionModel.updateMany(
      { documentIds: id },
      { $pull: { documentIds: id } },
    );

    await this.deleteUploadedFile(document.fileUrl);
    await this.uploadedDocModel.deleteOne({ _id: id });

    return true;
  }

  private async deleteUploadedFile(fileUrl: string): Promise<void> {
    const pathname = new URL(fileUrl).pathname;
    const filename = basename(decodeURIComponent(pathname));

    try {
      await unlink(join(process.cwd(), 'uploads', filename));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  async reprocessDocument(
    id: Types.ObjectId,
    user: UserDocument,
  ): Promise<boolean> {
    const doc = await this.getDocumentDetails(id, user);

    doc.status = 'PENDING';
    doc.errorMessage = undefined;
    await doc.save();

    this.documentProcessingQueue
      .add('process', {
        documentId: doc._id.toString(),
        fileUrl: doc.fileUrl,
      })
      .catch((err) => {
        console.error('Failed to add document to processing queue:', err);
      });

    return true;
  }
}
