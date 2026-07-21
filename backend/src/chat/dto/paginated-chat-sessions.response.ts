import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/pagination/dto/paginated.response';
import { ChatSession } from '../../schemas/chatSessions.schema';

@ObjectType()
export class PaginatedChatSessions extends Paginated(ChatSession) {}
