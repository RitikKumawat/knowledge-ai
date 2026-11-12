import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingsService } from './embeddings.service';

const mockEmbedContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      embedContent: mockEmbedContent,
    },
  })),
}));

describe('EmbeddingsService', () => {
  let service: EmbeddingsService;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmbeddingsService],
    }).compile();

    service = module.get<EmbeddingsService>(EmbeddingsService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('production (Gemini API)', () => {
    let prodService: EmbeddingsService;

    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmbeddingsService],
      }).compile();

      prodService = module.get<EmbeddingsService>(EmbeddingsService);
    });

    it('should throw if GEMINI_API_KEY is missing in production', async () => {
      delete process.env.GEMINI_API_KEY;

      await expect(
        Test.createTestingModule({
          providers: [EmbeddingsService],
        }).compile(),
      ).rejects.toThrow(
        'GEMINI_API_KEY is required when NODE_ENV is production',
      );
    });

    it('should embed a single query chunk with RETRIEVAL_QUERY and normalize it', async () => {
      mockEmbedContent.mockResolvedValueOnce({
        embeddings: [{ values: [3, 4] }],
      });

      const result =
        await prodService.generateEmbeddingsForSingleChunk('Hello');

      expect(mockEmbedContent).toHaveBeenCalledWith({
        model: 'gemini-embedding-001',
        contents: 'Hello',
        config: {
          taskType: 'RETRIEVAL_QUERY',
          outputDimensionality: 768,
        },
      });
      expect(result[0]).toBeCloseTo(0.6);
      expect(result[1]).toBeCloseTo(0.8);
    });

    it('should embed multiple document chunks with RETRIEVAL_DOCUMENT and normalize them', async () => {
      mockEmbedContent.mockResolvedValueOnce({
        embeddings: [{ values: [3, 4] }, { values: [0, 5] }],
      });

      const result = await prodService.generateEmbeddings([
        'chunk 1',
        'chunk 2',
      ]);

      expect(mockEmbedContent).toHaveBeenCalledWith({
        model: 'gemini-embedding-001',
        contents: ['chunk 1', 'chunk 2'],
        config: {
          taskType: 'RETRIEVAL_DOCUMENT',
          outputDimensionality: 768,
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0][0]).toBeCloseTo(0.6);
      expect(result[0][1]).toBeCloseTo(0.8);
      expect(result[1][0]).toBeCloseTo(0);
      expect(result[1][1]).toBeCloseTo(1);
    });
  });
});
