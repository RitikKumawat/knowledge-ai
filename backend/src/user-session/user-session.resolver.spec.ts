import { Test, TestingModule } from '@nestjs/testing';
import { UserSessionResolver } from './user-session.resolver';
import { UserSessionService } from './user-session.service';

describe('UserSessionResolver', () => {
  let resolver: UserSessionResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSessionResolver,
        {
          provide: UserSessionService,
          useValue: {},
        },
      ],
    }).compile();

    resolver = module.get<UserSessionResolver>(UserSessionResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
