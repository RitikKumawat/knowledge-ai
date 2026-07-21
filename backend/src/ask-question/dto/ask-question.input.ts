import { Field, ID, InputType } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class AskQuestionInput {
  @Field(() => ID)
  @IsMongoId()
  sessionId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  question!: string;
}
