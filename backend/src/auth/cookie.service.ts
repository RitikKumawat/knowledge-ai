import { Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from './constants/cookies.constants';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CookieService {
  setAccessToken(res: Response, token: string) {
    res.cookie(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });
  }

  setRefreshToken(res: Response, token: string) {
    res.cookie(REFRESH_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE);

    res.clearCookie(REFRESH_TOKEN_COOKIE);
  }
}
