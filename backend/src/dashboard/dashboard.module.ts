import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardResolver } from './dashboard.resolver';
import { DashboardService } from './dashboard.service';
import { ChatSession, ChatSessionSchema } from '../schemas/chatSessions.schema';
import { UploadedDoc, UploadedDocSchema } from '../schemas/uploadedDoc.schema';
import { Message, MessageSchema } from '../schemas/message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: UploadedDoc.name, schema: UploadedDocSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  providers: [DashboardResolver, DashboardService],
})
export class DashboardModule {}
