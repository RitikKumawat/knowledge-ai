import { Request, Response } from 'express';
import { UserDocument } from '../../../schemas/users.schema';

export interface AuthenticatedRequest extends Request {
  user?: UserDocument;
  sessionId?: string;
  cookies: Record<string, string>;
}

export interface JwtPayload {
  sub: string;
  sessionId: string;
}

export interface GraphqlContext {
  req: AuthenticatedRequest;
  res: Response;
}
