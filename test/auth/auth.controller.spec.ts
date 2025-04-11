import { Test, TestingModule } from '@nestjs/testing';
import { AuthPublicController } from '../../src/modules/auth/auth.public.controller';
import { AuthService } from '../../src/modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

describe('AuthPublicController', () => {
  let controller: AuthPublicController;
  let authService: AuthService;
  let jwtService: JwtService;

  const mockResponse = {
    cookie: jest.fn(),
  } as any as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthPublicController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateAttemptAndSignToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthPublicController>(AuthPublicController);
    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('login', () => {
    it('should set cookie and return login response', async () => {
      const mockLoginDto = {
        username: 'testuser',
        password: 'password',
      };

      const mockLoginResponse = {
        status: 'success',
        message: 'Login successful',
        userInfo: {
          _id: 'userId',
          username: 'testuser',
          role: 'admin',
        },
      };

      jest
        .spyOn(authService, 'validateAttemptAndSignToken')
        .mockResolvedValue(mockLoginResponse);

      const result = await controller.login(mockLoginDto, mockResponse);

      expect(result).toBe(mockLoginResponse);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'user_token',
        'mock-token',
        expect.any(Object)
      );
    });
  });

  describe('logout', () => {
    it('should clear cookie and return success message', async () => {
      const result = await controller.logout(mockResponse);

      expect(result.status).toBe('success');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'user_token',
        '',
        expect.any(Object)
      );
    });
  });
});
