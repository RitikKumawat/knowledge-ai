import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ChatSession,
  ChatSessionDocument,
} from '../schemas/chatSessions.schema';
import { Message, MessageDocument } from '../schemas/message.schema';
import {
  UploadedDoc,
  UploadedDocDocument,
} from '../schemas/uploadedDoc.schema';
import { CreateChatInput } from './dto/create-chat.input';
import { UserDocument } from '../schemas/users.schema';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginationInput } from '../common/pagination/dto/pagination.input';
import { IPaginatedType } from '../common/pagination/dto/paginated.response';
import { OllamaService } from '../ollama/ollama.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatSession.name)
    private readonly chatSessionModel: Model<ChatSessionDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(UploadedDoc.name)
    private readonly uploadedDocModel: Model<UploadedDocDocument>,
    private readonly paginationService: PaginationService,
    private readonly ollamaService: OllamaService,
  ) {}

  async createChat(
    user: UserDocument,
    input: CreateChatInput,
  ): Promise<ChatSessionDocument> {
    const documentObjectIds = input.documentIds.map(
      (id) => new Types.ObjectId(id),
    );

    if (documentObjectIds.length > 0) {
      const docs = await this.uploadedDocModel.find({
        _id: { $in: documentObjectIds },
        uploadedBy: user._id,
      });

      if (docs.length !== documentObjectIds.length) {
        throw new ForbiddenException(
          'One or more documents do not exist or you do not have permission to access them',
        );
      }
    }

    const title =
      input.title && input.title.trim() !== '' ? input.title : 'New Chat';

    const chat = new this.chatSessionModel({
      title,
      documentIds: documentObjectIds,
      userId: user._id,
    });

    return chat.save();
  }

  async listChats(
    user: UserDocument,
    paginationInput: PaginationInput,
  ): Promise<IPaginatedType<ChatSessionDocument>> {
    return this.paginationService.paginate<ChatSessionDocument>(
      this.chatSessionModel,
      { userId: user._id },
      paginationInput,
      { updatedAt: -1 },
    );
  }

  async getChatDetails(
    id: Types.ObjectId,
    user: UserDocument,
  ): Promise<ChatSessionDocument> {
    const chat = await this.chatSessionModel.findById(id);
    if (!chat) {
      throw new NotFoundException('Chat session not found');
    }

    if (chat.userId.toString() !== user._id.toString()) {
      throw new ForbiddenException(
        'You do not have permission to access this chat',
      );
    }

    return chat;
  }

  async deleteChat(id: Types.ObjectId, user: UserDocument): Promise<boolean> {
    const chat = await this.chatSessionModel.findById(id);
    if (!chat) {
      throw new NotFoundException('Chat session not found');
    }

    if (chat.userId.toString() !== user._id.toString()) {
      throw new ForbiddenException(
        'You do not have permission to delete this chat',
      );
    }

    await this.chatSessionModel.deleteOne({ _id: id });
    await this.messageModel.deleteMany({ sessionId: id });

    return true;
  }

  async generateAiTitle(
    sessionId: Types.ObjectId,
    firstMessageContent: string,
  ): Promise<void> {
    const untitledChat = await this.chatSessionModel.exists({
      _id: sessionId,
      title: 'New Chat',
    });
    if (!untitledChat) return;

    const generatedTitle = await this.ollamaService.generateAnswer([
      {
        role: 'system',
        content:
          'Create a concise title of at most 6 words for this chat. Return only the title, without quotes or punctuation.',
      },
      {
        role: 'user',
        content: firstMessageContent,
      },
    ]);
    const title = generatedTitle
      .trim()
      .split(/\s+/)
      .slice(0, 6)
      .join(' ')
      .replace(/^["']|["'.]+$/g, '');

    if (!title) return;

    await this.chatSessionModel.updateOne(
      { _id: sessionId, title: 'New Chat' },
      { $set: { title } },
    );
  }
}
