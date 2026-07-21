import { Injectable } from '@nestjs/common';
import ollama, { Message } from 'ollama';

@Injectable()
export class OllamaService {
  private static readonly MODEL = 'qwen3-coder:30b';
  async generateAnswer(messages: Message[]): Promise<string> {
    const result = await ollama.chat({
      model: OllamaService.MODEL,
      messages,
      stream: false,
    });

    return result.message.content;
  }

  async *generateAnswerStream(messages: Message[]): AsyncGenerator<string> {
    const response = await ollama.chat({
      model: OllamaService.MODEL,
      messages,
      stream: true,
    });

    for await (const chunk of response) {
      yield chunk.message.content;
    }
  }
}
