import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DocumentChunkDocument = HydratedDocument<DocumentChunk>;

@ObjectType()
@Schema({
  collection: 'document_chunks',
  timestamps: true,
})
export class DocumentChunk {
  @Field(() => ID)
  _id!: Types.ObjectId;

  @Field(() => ID)
  @Prop({
    required: true,
  })
  documentId!: Types.ObjectId;

  @Field(() => Int)
  @Prop({
    required: true,
  })
  chunkIndex!: number;

  @Field()
  @Prop({
    required: true,
  })
  content!: string;

  @Field()
  @Prop({
    required: true,
  })
  embeddingId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

export const DocumentChunkSchema = SchemaFactory.createForClass(DocumentChunk);
