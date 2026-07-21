import { Module } from '@nestjs/common';
import { UserSessionService } from './user-session.service';
import { UserSessionResolver } from './user-session.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { SCHEMAS } from '../schemas/index.schemas';

@Module({
  imports: [MongooseModule.forFeature(SCHEMAS)],
  providers: [UserSessionResolver, UserSessionService],
  exports: [UserSessionService],
})
export class UserSessionModule {}
