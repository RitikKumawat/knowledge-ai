import { registerEnumType } from '@nestjs/graphql';

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
}

registerEnumType(MessageRole, {
  name: 'MessageRole',
});
