import { Field, ID, InputType } from '@nestjs/graphql';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateChatInput {
  @Field(() => ID)
  @IsNotEmpty()
  @IsString()
  chatId: string;

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];
}
