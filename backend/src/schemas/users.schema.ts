import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@ObjectType()
@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  @Field(() => ID)
  _id!: Types.ObjectId;

  @Field()
  @Prop({
    required: true,
    trim: true,
  })
  name!: string;

  @Field()
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({
    required: true,
  })
  password!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
