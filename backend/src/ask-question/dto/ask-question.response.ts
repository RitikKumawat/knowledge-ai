import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Source {
  @Field(() => ID)
  documentId!: string;

  @Field()
  chunk!: string;

  @Field(() => Float)
  similarity!: number;
}

@ObjectType()
export class AskQuestionResponse {
  @Field()
  answer!: string;

  @Field(() => [Source])
  sources!: Source[];
}
