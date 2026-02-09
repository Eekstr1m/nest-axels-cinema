import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../enums/role.enum';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    _id: { toString: () => 'user-id-1' },
    email: 'user@example.com',
    password: 'hashed-password',
    role: Role.User,
    hashedRefreshToken: 'hashed-refresh',
  };

  const mockUsersService = {
    findOneByEmailWithPassword: jest.fn(),
    updateHashedRefreshToken: jest.fn(),
    createUser: jest.fn(),
    findOneByIdWithToken: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'REFRESH_JWT_SECRET') return 'refresh-secret';
      if (key === 'REFRESH_JWT_SECRET_EXPIRE') return '7d';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user id and role on success', async () => {
      mockUsersService.findOneByEmailWithPassword.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(mockUser.email, 'password');

      expect(result).toEqual({ userId: 'user-id-1', role: Role.User });
      expect(mockUsersService.findOneByEmailWithPassword).toHaveBeenCalledWith(
        mockUser.email,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password',
        mockUser.password,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findOneByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.validateUser('user@example.com', 'pass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      mockUsersService.findOneByEmailWithPassword.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser(mockUser.email, 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should login, hash refresh token, and update user', async () => {
      mockUsersService.findOneByEmailWithPassword.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');

      const result = await service.login(mockUser.email, 'password');

      expect(result).toEqual({
        id: 'user-id-1',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(usersService.updateHashedRefreshToken).toHaveBeenCalledWith(
        'user-id-1',
        'hashed-refresh-token',
      );
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      mockUsersService.findOneByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login('user@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error if hashing refresh token fails', async () => {
      mockUsersService.findOneByEmailWithPassword.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      (argon2.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(service.login(mockUser.email, 'password')).rejects.toThrow(
        'Hashing failed',
      );
    });
  });

  describe('register', () => {
    it('should create user and login', async () => {
      const registerDto: RegisterDto = {
        email: 'user@example.com',
        password: 'pass',
        fullName: 'John Doe',
        phone: '+380123456789',
      };
      mockUsersService.createUser.mockResolvedValue(mockUser);

      const loginSpy = jest.spyOn(service, 'login').mockResolvedValue({
        id: 'user-id-1',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await service.register(registerDto);

      expect(usersService.createUser).toHaveBeenCalledWith(registerDto);
      expect(loginSpy).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
      );
      expect(result).toEqual({
        id: 'user-id-1',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw error if user creation fails', async () => {
      const registerDto: RegisterDto = {
        email: 'user@example.com',
        password: 'pass',
        fullName: 'John Doe',
        phone: '+380123456789',
      };
      mockUsersService.createUser.mockRejectedValue(
        new Error('User creation failed'),
      );

      await expect(service.register(registerDto)).rejects.toThrow(
        'User creation failed',
      );
    });
  });

  describe('generateTokens', () => {
    it('should sign access and refresh tokens', async () => {
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.generateTokens('user-id-1', Role.User);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-id-1',
        role: Role.User,
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'user-id-1', role: Role.User },
        expect.objectContaining({
          secret: 'refresh-secret',
          expiresIn: '7d',
        }),
      );
      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'REFRESH_JWT_SECRET',
      );
      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'REFRESH_JWT_SECRET_EXPIRE',
      );
    });

    it('should throw error if signing tokens fails', async () => {
      jest
        .spyOn(jwtService, 'signAsync')
        .mockRejectedValue(new Error('Signing failed'));

      await expect(
        service.generateTokens('user-id-1', Role.User),
      ).rejects.toThrow('Signing failed');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens and update hashed refresh token', async () => {
      jest.spyOn(service, 'generateTokens').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');

      const result = await service.refreshToken('user-id-1', Role.User);

      expect(result).toEqual({
        id: 'user-id-1',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(usersService.updateHashedRefreshToken).toHaveBeenCalledWith(
        'user-id-1',
        'hashed-refresh-token',
      );
    });

    it('should throw error if token generation fails', async () => {
      jest
        .spyOn(service, 'generateTokens')
        .mockRejectedValue(new Error('Token generation failed'));

      await expect(
        service.refreshToken('user-id-1', Role.User),
      ).rejects.toThrow('Token generation failed');
    });
  });

  describe('validateRefreshToken', () => {
    it('should return user id and role on success', async () => {
      mockUsersService.findOneByIdWithToken.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.validateRefreshToken(
        'user-id-1',
        'refresh-token',
      );

      expect(result).toEqual({ userId: 'user-id-1', role: Role.User });
      expect(usersService.findOneByIdWithToken).toHaveBeenCalledWith(
        'user-id-1',
      );
      expect(argon2.verify).toHaveBeenCalledWith(
        'hashed-refresh',
        'refresh-token',
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findOneByIdWithToken.mockResolvedValue(null);

      await expect(
        service.validateRefreshToken('user-id-1', 'refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when no refresh token saved', async () => {
      mockUsersService.findOneByIdWithToken.mockResolvedValue({
        ...mockUser,
        hashedRefreshToken: '',
      });

      await expect(
        service.validateRefreshToken('user-id-1', 'refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear hashed refresh token', async () => {
      await service.logout('user-id-1');

      expect(usersService.updateHashedRefreshToken).toHaveBeenCalledWith(
        'user-id-1',
        '',
      );
    });

    it('should throw error if clearing refresh token fails', async () => {
      mockUsersService.updateHashedRefreshToken.mockRejectedValue(
        new Error('Logout failed'),
      );

      await expect(service.logout('user-id-1')).rejects.toThrow(
        'Logout failed',
      );
    });
  });
});
