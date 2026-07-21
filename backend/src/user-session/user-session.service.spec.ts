import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UserSessionService } from './user-session.service';
import { UserSession } from '../schemas/userSession.schema';

describe('UserSessionService', () => {
  let service: UserSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSessionService,
        {
          provide: getModelToken(UserSession.name),
          useValue: jest.fn(),
        },
      ],
    }).compile();

    service = module.get<UserSessionService>(UserSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
