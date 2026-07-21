import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { ChatService } from '../chat/chat.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { MessageService } from '../message/message.service';
import { OllamaService } from '../ollama/ollama.service';
import { PromptBuilderService } from '../prompt-builder/prompt-builder.service';
import { RetrievalService } from '../retrieval/retrieval.service';
import type { UserDocument } from '../schemas/users.schema';
import type { AskQuestionInput } from './dto/ask-question.input';
import type { AskQuestionResponse } from './dto/ask-question.response';
import { PubSub } from 'graphql-subscriptions';

@Injectable()
export class AskQuestionService {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly retrievalService: RetrievalService,
    private readonly promptBuilderService: PromptBuilderService,
    private readonly ollamaService: OllamaService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  async askQuestion(
    input: AskQuestionInput,
    user: UserDocument,
  ): Promise<AskQuestionResponse> {
    const sessionId = new Types.ObjectId(input.sessionId);
    const session = await this.chatService.getChatDetails(sessionId, user);
    const userMessage = await this.messageService.saveUserMessage(
      sessionId,
      input.question,
    );

    const queryEmbedding =
      await this.embeddingsService.generateEmbeddingsForSingleChunk(
        input.question,
      );
    const sources = await this.retrievalService.searchChunks(
      queryEmbedding,
      session.documentIds.map((id) => id.toString()),
      5,
    );

    const recentMessages = await this.messageService.getRecentMessages(
      sessionId,
      6,
    );
    const previousMessages = recentMessages
      .filter(
        (message) => message._id.toString() !== userMessage._id.toString(),
      )
      .slice(-5);
    const messages = this.promptBuilderService.buildMessages(
      input.question,
      sources,
      previousMessages,
    );

    // Process stream in the background
    (async () => {
      try {
        const stream = this.ollamaService.generateAnswerStream(messages);
        let fullAnswer = '';
        for await (const chunk of stream) {
          fullAnswer += chunk;
          await this.pubSub.publish(`answerStream_${sessionId.toString()}`, {
            answerStream: chunk,
          });
        }

        await this.messageService.saveAssistantMessage(sessionId, fullAnswer);

        if (previousMessages.length === 0) {
          await this.chatService.generateAiTitle(sessionId, input.question);
        }
      } catch (error) {
        console.error('Error in stream generation:', error);
      }
    })();

    return { answer: '', sources };
  }
}
