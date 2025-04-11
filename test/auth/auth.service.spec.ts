import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from '../../src/modules/auth/auth.service';
import { User, UserDocument } from '../../src/entities/user.entity';
import { Role } from '../../src/common/enums/role.enum';
import { BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: Model<UserDocument>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    _id: 'mockUserId',
    username: 'testuser',
    password: 'hashedPassword',
    role: Role.Admin,
    comparePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn(),
            findById: jest.fn(),
            new: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('validateAttemptAndSignToken', () => {
    it('should throw BadRequestException if password is missing', async () => {
      await expect(
        service.validateAttemptAndSignToken({ username: 'test' } as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user not found', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
      await expect(
        service.validateAttemptAndSignToken({
          username: 'test',
          password: 'password',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if password is invalid', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue(mockUser as any);
      mockUser.comparePassword.mockResolvedValue(false);
      await expect(
        service.validateAttemptAndSignToken({
          username: 'test',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should return user info if credentials are valid', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue(mockUser as any);
      mockUser.comparePassword.mockResolvedValue(true);
      const result = await service.validateAttemptAndSignToken({
        username: 'test',
        password: 'password',
      });
      expect(result.userInfo).toBeDefined();
      expect(result.userInfo.username).toBe(mockUser.username);
    });
  });
});
