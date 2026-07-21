import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { MessageModule } from '../message/message.module';
import { OllamaModule } from '../ollama/ollama.module';
import { PromptBuilderModule } from '../prompt-builder/prompt-builder.module';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { AskQuestionResolver } from './ask-question.resolver';
import { AskQuestionService } from './ask-question.service';

@Module({
  imports: [
    ChatModule,
    MessageModule,
    EmbeddingsModule,
    RetrievalModule,
    PromptBuilderModule,
    OllamaModule,
  ],
  providers: [AskQuestionResolver, AskQuestionService],
})
export class AskQuestionModule {}
