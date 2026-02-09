import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { Role } from 'src/auth/enums/role.enum';
import { CreateUserDto } from '../dto/create-user.dto';
import { ValidatedJwtUser } from 'src/auth/types/auth-jwt';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    _id: 'user-id-1',
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+380123456789',
    role: Role.User,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDetailedUser = {
    userId: 'user-id-1',
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+380123456789',
    role: Role.User,
    createdAt: new Date(),
    updatedAt: new Date(),
    totalMoviesBooked: 2,
    totalSeatsBooked: 3,
    totalMoneySpent: 450,
  };

  const mockCreateUserDto: CreateUserDto = {
    fullName: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '+380123456789',
  };

  const mockUsersService = {
    findOneById: jest.fn().mockResolvedValue(mockUser),
    getUserInfoById: jest.fn().mockResolvedValue(mockDetailedUser),
    createUser: jest.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const reqUser: ValidatedJwtUser = {
        userId: 'user-id-1',
        role: Role.User,
      };

      const result = await controller.getProfile({ user: reqUser });

      expect(result).toEqual(mockUser);
      expect(service.findOneById).toHaveBeenCalledWith('user-id-1');
    });

    it('should throw NotFoundException if user not found', async () => {
      const reqUser: ValidatedJwtUser = {
        userId: 'missing-id',
        role: Role.User,
      };
      mockUsersService.findOneById.mockRejectedValue('Unknown error');

      await expect(
        controller.getProfile({
          user: reqUser,
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.getProfile({
          user: reqUser,
        }),
      ).rejects.toThrow('User not found');
    });
  });

  describe('getUserInfoById', () => {
    it('should return detailed user info', async () => {
      const reqUser: ValidatedJwtUser = {
        userId: 'user-id-1',
        role: Role.User,
      };

      const result = await controller.getUserInfoById({ user: reqUser });

      expect(result).toEqual(mockDetailedUser);
      expect(service.getUserInfoById).toHaveBeenCalledWith('user-id-1');
    });

    it('should throw NotFoundException if user not found', async () => {
      const reqUser: ValidatedJwtUser = {
        userId: 'missing-id',
        role: Role.User,
      };
      mockUsersService.getUserInfoById.mockRejectedValue('Unknown error');

      await expect(
        controller.getUserInfoById({
          user: reqUser,
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.getUserInfoById({
          user: reqUser,
        }),
      ).rejects.toThrow('User not found');
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const result = await controller.createUser(mockCreateUserDto);

      expect(result).toEqual(mockUser);
      expect(service.createUser).toHaveBeenCalledWith(mockCreateUserDto);
    });

    it('should throw NotFoundException on error', async () => {
      mockUsersService.createUser.mockRejectedValue(
        new Error('User with this email already exists'),
      );

      await expect(controller.createUser(mockCreateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.createUser(mockCreateUserDto)).rejects.toThrow(
        'User with this email already exists',
      );
    });
  });
});
