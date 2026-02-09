import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { BadRequestException } from '@nestjs/common';
import { Role } from '../enums/role.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockLoginDto: LoginDto = {
    email: 'user@example.com',
    password: 'password123',
  };

  const mockRegisterDto: RegisterDto = {
    email: 'user@example.com',
    password: 'password123',
    fullName: 'John Doe',
    phone: '+380123456789',
  };

  const mockUser = {
    userId: 'user-id-1',
    role: Role.User,
  };

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({
      id: 'user-id-1',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }),
    register: jest.fn().mockResolvedValue({
      id: 'user-id-1',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }),
    refreshToken: jest.fn().mockResolvedValue({
      id: 'user-id-1',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }),
    logout: jest.fn().mockResolvedValue(undefined),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'NODE_ENV') return 'test';
      if (key === 'REFRESH_JWT_COOKIE_MAX_AGE_MS') return '3600000';
      return undefined;
    }),
  };

  const createMockResponse = (): Response =>
    ({
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    }) as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should login and set refresh cookie', async () => {
      const res = createMockResponse();

      const result = await controller.login(mockLoginDto, res);

      expect(result).toEqual({ id: 'user-id-1', accessToken: 'access-token' });
      expect(service.login).toHaveBeenCalledWith(
        mockLoginDto.email,
        mockLoginDto.password,
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/auth/refresh',
          maxAge: 3600000,
        }),
      );
    });

    it('should throw BadRequestException on error', async () => {
      const res = createMockResponse();
      mockAuthService.login.mockRejectedValue(new Error('Login failed'));

      await expect(controller.login(mockLoginDto, res)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.login(mockLoginDto, res)).rejects.toThrow(
        'Login failed',
      );
    });
  });

  describe('register', () => {
    it('should register and set refresh cookie', async () => {
      const res = createMockResponse();

      const result = await controller.register(mockRegisterDto, res);

      expect(result).toEqual({ id: 'user-id-1', accessToken: 'access-token' });
      expect(service.register).toHaveBeenCalledWith(mockRegisterDto);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/auth/refresh',
          maxAge: 3600000,
        }),
      );
    });

    it('should throw BadRequestException on error', async () => {
      const res = createMockResponse();
      mockAuthService.register.mockRejectedValue(
        new Error('Registration failed'),
      );

      await expect(controller.register(mockRegisterDto, res)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.register(mockRegisterDto, res)).rejects.toThrow(
        'Registration failed',
      );
    });
  });

  describe('refresh', () => {
    it('should refresh token and set new refresh cookie', async () => {
      const res = createMockResponse();

      const result = await controller.refreshToken({ user: mockUser }, res);

      expect(result).toEqual({ id: 'user-id-1', accessToken: 'access-token' });
      expect(service.refreshToken).toHaveBeenCalledWith(
        mockUser.userId,
        mockUser.role,
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/auth/refresh',
          maxAge: 3600000,
        }),
      );
    });

    it('should throw BadRequestException on error', async () => {
      const res = createMockResponse();
      mockAuthService.refreshToken.mockRejectedValue(
        new Error('Refresh failed'),
      );

      await expect(
        controller.refreshToken({ user: mockUser }, res),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.refreshToken({ user: mockUser }, res),
      ).rejects.toThrow('Refresh failed');
    });
  });

  describe('logout', () => {
    it('should logout and clear refresh cookie', async () => {
      const res = createMockResponse();

      const result = await controller.logout({ user: mockUser }, res);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(service.logout).toHaveBeenCalledWith(mockUser.userId);
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/auth/refresh',
          maxAge: 3600000,
        }),
      );
    });

    it('should throw BadRequestException on error', async () => {
      const res = createMockResponse();
      mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));

      await expect(controller.logout({ user: mockUser }, res)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.logout({ user: mockUser }, res)).rejects.toThrow(
        'Logout failed',
      );
    });
  });
});
