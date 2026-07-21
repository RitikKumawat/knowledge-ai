import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import {
  ChatSession,
  ChatSessionDocument,
} from '../schemas/chatSessions.schema';
import { UserDocument } from '../schemas/users.schema';
import { MessageRole } from '../enum/messageRole.enum';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(ChatSession.name)
    private readonly chatSessionModel: Model<ChatSessionDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async getMessages(sessionId: Types.ObjectId, user: UserDocument) {
    const chat = await this.chatSessionModel.findById(sessionId);
    if (!chat) {
      throw new NotFoundException('Chat session not found');
    }

    if (chat.userId.toString() !== user._id.toString()) {
      throw new ForbiddenException(
        'You do not have permission to access this chat',
      );
    }

    return this.messageModel.find({ sessionId }).sort({ createdAt: 1 });
  }

  async saveUserMessage(sessionId: Types.ObjectId, content: string) {
    const msg = new this.messageModel({
      sessionId,
      role: MessageRole.USER,
      content,
    });
    return msg.save();
  }

  async saveAssistantMessage(sessionId: Types.ObjectId, content: string) {
    const msg = new this.messageModel({
      sessionId,
      role: MessageRole.ASSISTANT,
      content,
    });
    return msg.save();
  }

  async getRecentMessages(sessionId: Types.ObjectId, limit: number = 5) {
    const messages = await this.messageModel
      .find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return messages.reverse();
  }
}
