import { Test, TestingModule } from '@nestjs/testing';
import { MessageRole } from '../enum/messageRole.enum';
import type { RetrievedChunk } from '../retrieval/retrieval.service';
import { PromptBuilderService } from './prompt-builder.service';

describe('PromptBuilderService', () => {
  let service: PromptBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptBuilderService],
    }).compile();

    service = module.get<PromptBuilderService>(PromptBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('builds a prompt from conversation, context, and a question', () => {
    const chunks: RetrievedChunk[] = [
      { chunk: 'JWTs are signed tokens.', similarity: 0.95, documentId: '1' },
      { chunk: 'They may contain claims.', similarity: 0.9, documentId: '1' },
    ];

    const prompt = service.buildPrompt('What is a JWT?', chunks, [
      { role: MessageRole.USER, content: 'Tell me about authentication.' },
      {
        role: MessageRole.ASSISTANT,
        content: 'Authentication verifies identity.',
      },
    ]);

    expect(prompt).toBe(
      [
        'Previous Conversation:',
        'User:\nTell me about authentication.\n\nAssistant:\nAuthentication verifies identity.',
        'Context:',
        'JWTs are signed tokens.\n\nThey may contain claims.',
        'Question:',
        'What is a JWT?',
        'Answer only from context.',
      ].join('\n\n'),
    );
  });

  it('keeps empty conversation and context sections', () => {
    expect(service.buildPrompt('What is a JWT?', [], [])).toBe(
      [
        'Previous Conversation:',
        '',
        'Context:',
        '',
        'Question:',
        'What is a JWT?',
        'Answer only from context.',
      ].join('\n\n'),
    );
  });

  it('limits prompt memory and context to five items', () => {
    const chunks = Array.from({ length: 6 }, (_, index) => ({
      chunk: `chunk-${index}`,
      similarity: 1,
      documentId: '1',
    }));
    const messages = Array.from({ length: 6 }, (_, index) => ({
      role: MessageRole.USER,
      content: `message-${index}`,
    }));

    const prompt = service.buildPrompt('question', chunks, messages);

    expect(prompt).not.toContain('message-0');
    expect(prompt).toContain('message-5');
    expect(prompt).toContain('chunk-0');
    expect(prompt).not.toContain('chunk-5');
  });
});
