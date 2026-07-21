import { Resolver } from '@nestjs/graphql';
import { UserSessionService } from './user-session.service';

@Resolver()
export class UserSessionResolver {
  constructor(private readonly userSessionService: UserSessionService) {}
}
