import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatSessionDocument = HydratedDocument<ChatSession>;

@ObjectType()
@Schema({
  collection: 'chat_sessions',
  timestamps: true,
})
export class ChatSession {
  @Field(() => ID)
  _id!: Types.ObjectId;

  @Field()
  @Prop({
    required: true,
  })
  title!: string;

  @Field(() => [ID])
  @Prop({
    type: [Types.ObjectId],
    ref: 'UploadedDoc',
    default: [],
  })
  documentIds!: Types.ObjectId[];

  @Field(() => ID)
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId!: Types.ObjectId;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
