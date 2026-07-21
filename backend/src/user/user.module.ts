import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { SCHEMAS } from '../schemas/index.schemas';

@Module({
  imports: [MongooseModule.forFeature(SCHEMAS)],
  providers: [UserResolver, UserService],
  exports: [UserService],
})
export class UserModule {}
