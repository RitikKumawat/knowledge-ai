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

  it('builds messages from conversation, context, and a question', () => {
    const chunks: RetrievedChunk[] = [
      { chunk: 'JWTs are signed tokens.', similarity: 0.95, documentId: '1' },
      { chunk: 'They may contain claims.', similarity: 0.9, documentId: '1' },
    ];

    const messages = service.buildMessages('What is a JWT?', chunks, [
      { role: MessageRole.USER, content: 'Tell me about authentication.' },
      {
        role: MessageRole.ASSISTANT,
        content: 'Authentication verifies identity.',
      },
    ]);

    expect(messages).toHaveLength(4);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('JWTs are signed tokens.');
    expect(messages[0].content).toContain('They may contain claims.');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toBe('Tell me about authentication.');
    expect(messages[2].role).toBe('assistant');
    expect(messages[2].content).toBe('Authentication verifies identity.');
    expect(messages[3].role).toBe('user');
    expect(messages[3].content).toContain('What is a JWT?');
  });

  it('keeps empty conversation and context sections', () => {
    const messages = service.buildMessages('What is a JWT?', [], []);
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('No context provided.');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toContain('What is a JWT?');
  });

  it('limits prompt memory and context to five items', () => {
    const chunks = Array.from({ length: 6 }, (_, index) => ({
      chunk: `chunk-${index}`,
      similarity: 1,
      documentId: '1',
    }));
    const prevMessages = Array.from({ length: 6 }, (_, index) => ({
      role: MessageRole.USER,
      content: `message-${index}`,
    }));

    const messages = service.buildMessages('question', chunks, prevMessages);

    expect(messages[0].content).toContain('chunk-0');
    expect(messages[0].content).not.toContain('chunk-5');

    expect(messages).toHaveLength(7);
    expect(messages.some((m) => m.content === 'message-0')).toBe(false);
    expect(messages.some((m) => m.content === 'message-5')).toBe(true);
  });
});
