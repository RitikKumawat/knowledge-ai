import { Injectable } from '@nestjs/common';
import ollama, { Message } from 'ollama';
import { Groq } from 'groq-sdk';

@Injectable()
export class OllamaService {
  private static readonly LOCAL_MODEL = 'qwen2.5-coder:14b';
  private static readonly PROD_MODEL = 'llama-3.1-8b-instant';
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly groq: Groq | null = null;

  constructor() {
    if (this.isProduction) {
      this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
  }

  async generateAnswer(messages: Message[]): Promise<string> {
    if (this.isProduction) {
      const groqMessages = messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));
      const response = await this.groq!.chat.completions.create({
        model: OllamaService.PROD_MODEL,
        messages: groqMessages,
      });
      return response.choices[0]?.message?.content || '';
    } else {
      const result = await ollama.chat({
        model: OllamaService.LOCAL_MODEL,
        messages,
        stream: false,
      });

      return result.message.content;
    }
  }

  async *generateAnswerStream(messages: Message[]): AsyncGenerator<string> {
    if (this.isProduction) {
      const groqMessages = messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));
      const stream = await this.groq!.chat.completions.create({
        model: OllamaService.PROD_MODEL,
        messages: groqMessages,
        stream: true,
      });
      for await (const chunk of stream) {
        yield chunk.choices[0]?.delta?.content || '';
      }
    } else {
      const response = await ollama.chat({
        model: OllamaService.LOCAL_MODEL,
        messages,
        stream: true,
      });

      for await (const chunk of response) {
        yield chunk.message.content;
      }
    }
  }
}
