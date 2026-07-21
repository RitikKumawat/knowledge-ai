import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

import { AuthService } from '../auth.service';
import { ROLE } from '../constants/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { GraphqlContext } from '../common/interfaces/auth.interfaces';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<ROLE[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (roles?.includes(ROLE.PUBLIC)) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context);

    const { req, res } = gqlContext.getContext<GraphqlContext>();

    req.user = await this.authService.validateRequest(req, res);

    return req.user !== undefined;
  }
}
