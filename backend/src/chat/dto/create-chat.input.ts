import { Field, ID, InputType } from '@nestjs/graphql';
import { IsArray, IsMongoId, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateChatInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field(() => [ID])
  @IsArray()
  @IsMongoId({ each: true })
  documentIds!: string[];
}
