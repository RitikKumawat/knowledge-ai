import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ChatSession,
  ChatSessionDocument,
} from '../schemas/chatSessions.schema';
import {
  UploadedDoc,
  UploadedDocDocument,
} from '../schemas/uploadedDoc.schema';
import { Message, MessageDocument } from '../schemas/message.schema';
import { MessageRole } from '../enum/messageRole.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(ChatSession.name)
    private chatSessionModel: Model<ChatSessionDocument>,
    @InjectModel(UploadedDoc.name)
    private uploadedDocModel: Model<UploadedDocDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async getDashboardData(userId: Types.ObjectId) {
    const [totalChats, activeDocuments, uploadedDocsAgg] = await Promise.all([
      this.chatSessionModel.countDocuments({ userId }),
      this.uploadedDocModel.countDocuments({
        uploadedBy: userId,
        status: 'COMPLETED',
      }),
      this.uploadedDocModel.aggregate<{ totalPages: number }>([
        { $match: { uploadedBy: userId, status: 'COMPLETED' } },
        { $group: { _id: null, totalPages: { $sum: '$pages' } } },
      ]),
    ]);

    const totalPages =
      uploadedDocsAgg.length > 0 ? uploadedDocsAgg[0].totalPages : 0;

    const userChats = await this.chatSessionModel
      .find({ userId })
      .select('_id');
    const userChatIds = userChats.map((c) => c._id);

    const totalQueries = await this.messageModel.countDocuments({
      sessionId: { $in: userChatIds },
      role: MessageRole.USER,
    });

    const recentActivitiesRaw = await this.chatSessionModel
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('_id title updatedAt');

    const recentActivities = await Promise.all(
      recentActivitiesRaw.map(async (chat) => {
        const messageCount = await this.messageModel.countDocuments({
          sessionId: chat._id,
        });
        return {
          _id: chat._id,
          title: chat.title,
          updatedAt: chat.updatedAt,
          messageCount,
        };
      }),
    );

    const topDocumentsAgg = await this.chatSessionModel.aggregate<{
      _id: Types.ObjectId;
      chatCount: number;
    }>([
      { $match: { userId } },
      { $unwind: '$documentIds' },
      { $group: { _id: '$documentIds', chatCount: { $sum: 1 } } },
      { $sort: { chatCount: -1 } },
      { $limit: 5 },
    ]);

    const topDocuments = await Promise.all(
      topDocumentsAgg.map(async (agg) => {
        const doc = await this.uploadedDocModel
          .findById(agg._id)
          .select('filename');
        return {
          _id: agg._id,
          filename: doc ? doc.filename : 'Deleted Document',
          chatCount: agg.chatCount,
        };
      }),
    );

    return {
      stats: {
        totalChats,
        activeDocuments,
        totalPages,
        totalQueries,
      },
      recentActivities,
      topDocuments,
    };
  }
}
