import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MessageRole } from '../enum/messageRole.enum';

export type MessageDocument = HydratedDocument<Message>;

@ObjectType()
@Schema({
  collection: 'messages',
  timestamps: true,
})
export class Message {
  @Field(() => ID)
  _id!: Types.ObjectId;

  @Field(() => ID)
  @Prop({
    type: Types.ObjectId,
    ref: 'ChatSession',
    required: true,
  })
  sessionId!: Types.ObjectId;

  @Field(() => MessageRole)
  @Prop({
    required: true,
    enum: MessageRole,
  })
  role!: MessageRole;

  @Field()
  @Prop({
    required: true,
  })
  content!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
