import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  UserSession,
  UserSessionDocument,
} from '../schemas/userSession.schema';
import { Model, Types } from 'mongoose';

type CreateSessionInput = Pick<
  UserSession,
  'userId' | 'refreshTokenHash' | 'expiresAt'
> &
  Partial<Pick<UserSession, 'ipAddress' | 'userAgent'>> & {
    _id?: Types.ObjectId;
  };

@Injectable()
export class UserSessionService {
  constructor(
    @InjectModel(UserSession.name)
    private readonly userSessionModel: Model<UserSessionDocument>,
  ) {}

  async findById(
    sessionId: Types.ObjectId,
  ): Promise<UserSessionDocument | null> {
    return this.userSessionModel.findById(sessionId).exec();
  }

  async createSession(input: CreateSessionInput): Promise<UserSessionDocument> {
    const session = new this.userSessionModel(input);

    return session.save();
  }

  async updateRefreshTokenHash(
    sessionId: Types.ObjectId,
    refreshTokenHash: string,
  ): Promise<UserSessionDocument | null> {
    return this.userSessionModel
      .findByIdAndUpdate(sessionId, { refreshTokenHash }, { new: true })
      .exec();
  }

  async deactivateSession(
    sessionId: Types.ObjectId,
  ): Promise<UserSessionDocument | null> {
    return this.userSessionModel
      .findByIdAndUpdate(sessionId, { isActive: false }, { new: true })
      .exec();
  }
}
