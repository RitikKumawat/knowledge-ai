import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { TokenService } from './token.service';
import { UserSessionService } from '../user-session/user-session.service';
import { CookieService } from './cookie.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {},
        },
        {
          provide: TokenService,
          useValue: {},
        },
        {
          provide: UserSessionService,
          useValue: {},
        },
        {
          provide: CookieService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
