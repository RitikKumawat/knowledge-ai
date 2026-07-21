import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UploadedDocDocument = HydratedDocument<UploadedDoc>;

@ObjectType()
@Schema({
  collection: 'uploaded_docs',
  timestamps: true,
})
export class UploadedDoc {
  @Field(() => ID)
  _id!: Types.ObjectId;

  @Field()
  @Prop({
    required: true,
    trim: true,
  })
  filename!: string;

  @Field()
  @Prop({
    required: true,
    trim: true,
  })
  fileUrl!: string;

  @Field(() => Int)
  @Prop({
    required: true,
    default: 0,
    min: 0,
  })
  pages!: number;

  @Field(() => Int)
  @Prop({
    required: true,
    default: 0,
    min: 0,
  })
  chunksCount!: number;

  @Field(() => ID)
  @Prop({
    required: true,
  })
  uploadedBy!: Types.ObjectId;

  @Field()
  @Prop({
    required: true,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  })
  status!: string;

  @Field({ nullable: true })
  @Prop()
  errorMessage?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

export const UploadedDocSchema = SchemaFactory.createForClass(UploadedDoc);
