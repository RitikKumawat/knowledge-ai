import { ChatSession, ChatSessionSchema } from './chatSessions.schema';
import { UploadedDoc, UploadedDocSchema } from './uploadedDoc.schema';
import { Message, MessageSchema } from './message.schema';
import { User, UserSchema } from './users.schema';
import { UserSession, UserSessionSchema } from './userSession.schema';
import { DocumentChunk, DocumentChunkSchema } from './documentChunk.schema';

export const SCHEMAS = [
  { name: ChatSession.name, schema: ChatSessionSchema },
  { name: Message.name, schema: MessageSchema },
  { name: UploadedDoc.name, schema: UploadedDocSchema },
  { name: User.name, schema: UserSchema },
  { name: UserSession.name, schema: UserSessionSchema },
  { name: DocumentChunk.name, schema: DocumentChunkSchema },
];
