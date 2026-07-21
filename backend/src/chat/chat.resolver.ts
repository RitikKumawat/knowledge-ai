import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { ChatService } from './chat.service';
import { ChatSession } from '../schemas/chatSessions.schema';
import { CreateChatInput } from './dto/create-chat.input';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE } from '../auth/constants/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../schemas/users.schema';
import { PaginatedChatSessions } from './dto/paginated-chat-sessions.response';
import { PaginationInput } from '../common/pagination/dto/pagination.input';

@Resolver(() => ChatSession)
@Roles(ROLE.USER)
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  @Mutation(() => ChatSession)
  async createChat(
    @Args('input') input: CreateChatInput,
    @CurrentUser() user: UserDocument,
  ): Promise<ChatSession> {
    return this.chatService.createChat(user, input);
  }

  @Query(() => PaginatedChatSessions)
  async chatSessions(
    @Args('paginationInput') paginationInput: PaginationInput,
    @CurrentUser() user: UserDocument,
  ): Promise<PaginatedChatSessions> {
    return this.chatService.listChats(user, paginationInput);
  }

  @Query(() => ChatSession)
  async chatSession(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<ChatSession> {
    return this.chatService.getChatDetails(new Types.ObjectId(id), user);
  }

  @Mutation(() => Boolean)
  async deleteChat(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<boolean> {
    return this.chatService.deleteChat(new Types.ObjectId(id), user);
  }
}
