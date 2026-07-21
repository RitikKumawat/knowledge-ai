import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageResolver } from './message.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { SCHEMAS } from '../schemas/index.schemas';

@Module({
  imports: [MongooseModule.forFeature(SCHEMAS)],
  providers: [MessageService, MessageResolver],
  exports: [MessageService],
})
export class MessageModule {}
