import { Args, Mutation, Resolver, Subscription } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE } from '../auth/constants/role.enum';
import type { UserDocument } from '../schemas/users.schema';
import { AskQuestionService } from './ask-question.service';
import { AskQuestionInput } from './dto/ask-question.input';
import { AskQuestionResponse } from './dto/ask-question.response';
import { Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

@Resolver()
@Roles(ROLE.USER)
export class AskQuestionResolver {
  constructor(
    private readonly askQuestionService: AskQuestionService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  @Mutation(() => AskQuestionResponse)
  async askQuestion(
    @Args('input') input: AskQuestionInput,
    @CurrentUser() user: UserDocument,
  ): Promise<AskQuestionResponse> {
    return this.askQuestionService.askQuestion(input, user);
  }

  @Subscription(() => String, {
    resolve: (payload: { answerStream: string }) => payload.answerStream,
  })
  answerStream(@Args('sessionId') sessionId: string) {
    return this.pubSub.asyncIterableIterator(`answerStream_${sessionId}`);
  }
}
