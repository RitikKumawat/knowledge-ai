import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { MessageService } from './message.service';
import { Message } from '../schemas/message.schema';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE } from '../auth/constants/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../schemas/users.schema';

@Resolver(() => Message)
@Roles(ROLE.USER)
export class MessageResolver {
  constructor(private readonly messageService: MessageService) {}

  @Query(() => [Message])
  async messages(
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.messageService.getMessages(new Types.ObjectId(sessionId), user);
  }
}
