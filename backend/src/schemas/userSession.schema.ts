import { ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserSessionDocument = HydratedDocument<UserSession>;

@ObjectType()
@Schema({
  collection: 'user_sessions',
  timestamps: true,
})
export class UserSession {
  @Prop({
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    required: true,
  })
  refreshTokenHash!: string;

  @Prop({
    required: true,
  })
  expiresAt!: Date;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({
    default: true,
  })
  isActive!: boolean;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
