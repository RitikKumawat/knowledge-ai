import { createParamDecorator } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphqlContext } from '../common/interfaces/auth.interfaces';

export const CurrentUser = createParamDecorator((_, context) => {
  const ctx = GqlExecutionContext.create(context);

  return ctx.getContext<GraphqlContext>().req.user;
});
