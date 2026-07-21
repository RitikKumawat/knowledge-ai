import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { Auth } from './entities/auth.entity';
import { UserLoginInput, UserSignupInput } from './dto/create-auth.input';
import type { GraphqlContext } from './common/interfaces/auth.interfaces';
import { Roles } from './decorators/roles.decorator';
import { ROLE } from './constants/role.enum';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../schemas/users.schema';
import type { UserDocument } from '../schemas/users.schema';

@Resolver(() => Auth)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Roles(ROLE.PUBLIC)
  @Mutation(() => String)
  async userSignUp(@Args('input') input: UserSignupInput): Promise<string> {
    return this.authService.userSignUp(input);
  }

  @Roles(ROLE.PUBLIC)
  @Mutation(() => String)
  async userLogin(
    @Args('input') input: UserLoginInput,
    @Context() context: GraphqlContext,
  ): Promise<string> {
    return this.authService.userLogin(input, context.req, context.res);
  }

  @Roles(ROLE.USER)
  @Mutation(() => String)
  async userLogout(@Context() context: GraphqlContext): Promise<string> {
    return this.authService.userLogout(context.req, context.res);
  }

  @Roles(ROLE.USER)
  @Query(() => User)
  getUserProfile(@CurrentUser() user: UserDocument): UserDocument {
    return user;
  }
}
