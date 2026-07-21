import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { SCHEMAS } from '../schemas/index.schemas';
import { OllamaModule } from '../ollama/ollama.module';

@Module({
  imports: [MongooseModule.forFeature(SCHEMAS), OllamaModule],
  providers: [ChatResolver, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
