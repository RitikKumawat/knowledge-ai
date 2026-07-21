import ollama from 'ollama';
import { OllamaService } from './ollama.service';

jest.mock('ollama', () => ({
  __esModule: true,
  default: {
    generate: jest.fn(),
  },
}));

describe('OllamaService', () => {
  let service: OllamaService;
  const mockedOllama = jest.mocked(ollama);

  beforeEach(() => {
    service = new OllamaService();
    mockedOllama.generate.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('generates a non-streaming answer with qwen3-coder:30b', async () => {
    mockedOllama.generate.mockResolvedValue({
      response: 'Generated answer',
    } as never);

    await expect(service.generateAnswer('RAG prompt')).resolves.toBe(
      'Generated answer',
    );
    expect(mockedOllama.generate.mock.calls).toEqual([
      [
        {
          model: 'qwen3-coder:30b',
          prompt: 'RAG prompt',
          stream: false,
        },
      ],
    ]);
  });

  it('propagates Ollama errors', async () => {
    const error = new Error('Ollama unavailable');
    mockedOllama.generate.mockRejectedValue(error);

    await expect(service.generateAnswer('RAG prompt')).rejects.toBe(error);
  });
});
