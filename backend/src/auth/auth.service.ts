import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserLoginInput, UserSignupInput } from './dto/create-auth.input';
import { UserService } from '../user/user.service';
import { UserDocument } from '../schemas/users.schema';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from './constants/cookies.constants';
import { TokenService } from './token.service';
import { UserSessionService } from '../user-session/user-session.service';
import { Types } from 'mongoose';
import {
  AuthenticatedRequest,
  JwtPayload,
} from './common/interfaces/auth.interfaces';
import bcrypt from 'bcrypt';
import { Response } from 'express';
import { CookieService } from './cookie.service';
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly userSessionService: UserSessionService,
    private readonly cookieService: CookieService,
  ) {}
  async userSignUp(input: UserSignupInput): Promise<string> {
    const existingUser = await this.userService.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    const hashedPassword = await bcrypt.hash(input.password, 10);
    await this.userService.createUser({ ...input, password: hashedPassword });
    return 'User signed up successfully!';
  }

  async userLogin(
    input: UserLoginInput,
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<string> {
    const user = await this.userService.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const sessionId = new Types.ObjectId();

    const payload = {
      sub: user._id.toString(),
      sessionId: sessionId.toString(),
    };

    const accessToken = await this.tokenService.generateAccessToken(payload);
    const refreshToken = await this.tokenService.generateRefreshToken(payload);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.userSessionService.createSession({
      _id: sessionId,
      userId: user._id,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    this.cookieService.setAccessToken(res, accessToken);
    this.cookieService.setRefreshToken(res, refreshToken);

    return 'User logged in successfully!';
  }

  async userLogout(req: AuthenticatedRequest, res: Response): Promise<string> {
    await this.userSessionService.deactivateSession(
      new Types.ObjectId(req.sessionId),
    );

    this.cookieService.clearAuthCookies(res);

    return 'User logged out successfully!';
  }

  async validateRequest(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<UserDocument> {
    const payload = await this.getValidPayload(req, res);

    const user = await this.userService.findById(
      new Types.ObjectId(payload.sub),
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    req.sessionId = payload.sessionId;

    return user;
  }

  private async getValidPayload(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<JwtPayload> {
    const accessToken = req.cookies?.[ACCESS_TOKEN_COOKIE];

    if (accessToken) {
      try {
        const payload = await this.tokenService.verifyAccessToken(accessToken);
        await this.verifySession(payload.sessionId);
        return payload;
      } catch (error) {
        console.error('Access token error', error);
        // Access token invalid or expired. Fall back to refresh token.
      }
    }

    return this.refreshTokens(req, res);
  }

  private async refreshTokens(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<JwtPayload> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Authentication required');
    }

    let payload: JwtPayload;
    try {
      payload = await this.tokenService.verifyRefreshToken(refreshToken);
    } catch (error) {
      console.error('Refresh token error', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const session = await this.verifySession(payload.sessionId);

    if (session.expiresAt && session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    const isMatch = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newPayload = {
      sub: payload.sub,
      sessionId: payload.sessionId,
    };

    const newAccessToken =
      await this.tokenService.generateAccessToken(newPayload);
    const newRefreshToken =
      await this.tokenService.generateRefreshToken(newPayload);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    await this.userSessionService.updateRefreshTokenHash(
      session._id,
      newRefreshTokenHash,
    );

    this.cookieService.setAccessToken(res, newAccessToken);
    this.cookieService.setRefreshToken(res, newRefreshToken);

    return newPayload;
  }

  private async verifySession(sessionId: string) {
    const session = await this.userSessionService.findById(
      new Types.ObjectId(sessionId),
    );

    if (!session?.isActive) {
      throw new UnauthorizedException('Session expired or inactive');
    }

    return session;
  }
}
