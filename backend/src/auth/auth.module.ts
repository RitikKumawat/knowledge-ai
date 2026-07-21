import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { SCHEMAS } from '../schemas/index.schemas';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { CookieService } from './cookie.service';
import { UserModule } from '../user/user.module';
import { UserSessionModule } from '../user-session/user-session.module';

@Module({
  imports: [
    MongooseModule.forFeature(SCHEMAS),
    JwtModule.register({}),
    UserModule,
    UserSessionModule,
  ],
  providers: [AuthResolver, AuthService, TokenService, CookieService],
  exports: [AuthService],
})
export class AuthModule {}
