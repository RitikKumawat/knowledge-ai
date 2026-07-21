import { Module } from '@nestjs/common';
import { OllamaStreamingService } from './ollama-streaming.service';
import { OllamaService } from './ollama.service';

@Module({
  providers: [OllamaService, OllamaStreamingService],
  exports: [OllamaService, OllamaStreamingService],
})
export class OllamaModule {}
