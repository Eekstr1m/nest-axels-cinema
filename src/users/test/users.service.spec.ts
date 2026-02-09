import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import mongoose, { Model } from 'mongoose';
import { User, UserDocument } from '../schema/user.schema';
import { Role } from 'src/auth/enums/role.enum';
import { getModelToken } from '@nestjs/mongoose';
import { Booking } from 'src/booking/schema/booking.schema';
import { CreateUserDto } from '../dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: jest.Mocked<Model<User>>;
  let bookingModel: { find: jest.Mock };

  const mockUserDoc = {
    _id: new mongoose.Types.ObjectId(),
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+380123456789',
    role: Role.User,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as UserDocument;

  const mockBookings = [
    {
      bookedSeats: [[{ row: 1, number: 1, isBooked: true }]],
      totalPrice: 150,
    },
    {
      bookedSeats: [
        [{ row: 1, number: 2, isBooked: true }],
        [{ row: 2, number: 1, isBooked: true }],
      ],
      totalPrice: 300,
    },
  ];

  beforeEach(async () => {
    const userModelConstructor = jest.fn();

    userModel = Object.assign(userModelConstructor, {
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    }) as unknown as jest.Mocked<Model<User>>;

    bookingModel = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
        {
          provide: getModelToken(Booking.name),
          useValue: bookingModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneById', () => {
    it('should return a user by id', async () => {
      userModel.findById.mockResolvedValue(mockUserDoc);

      const result = await service.findOneById(mockUserDoc._id.toString());

      expect(result).toEqual(mockUserDoc);
      expect(userModel.findById).toHaveBeenCalledWith(
        mockUserDoc._id.toString(),
      );
    });

    it('should throw error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      await expect(service.findOneById('missing-id')).rejects.toThrow(
        'User with id missing-id not found',
      );
    });
  });

  describe('findOneByIdWithToken', () => {
    it('should return user with hashed refresh token', async () => {
      const mockSelect = jest.fn().mockResolvedValue(mockUserDoc);
      userModel.findById.mockReturnValue({
        select: mockSelect,
      } as unknown as ReturnType<typeof userModel.findById>);

      const result = await service.findOneByIdWithToken(
        mockUserDoc._id.toString(),
      );

      expect(result).toEqual(mockUserDoc);
      expect(userModel.findById).toHaveBeenCalledWith(
        mockUserDoc._id.toString(),
      );
      expect(mockSelect).toHaveBeenCalledWith('+hashedRefreshToken');
    });

    it('should throw error when user not found', async () => {
      const mockSelect = jest.fn().mockResolvedValue(null);
      userModel.findById.mockReturnValue({
        select: mockSelect,
      } as unknown as ReturnType<typeof userModel.findById>);

      await expect(service.findOneByIdWithToken('missing-id')).rejects.toThrow(
        'User with id missing-id not found',
      );
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user by email', async () => {
      userModel.findOne.mockResolvedValue(mockUserDoc);

      const result = await service.findOneByEmail(mockUserDoc.email);

      expect(result).toEqual(mockUserDoc);
      expect(userModel.findOne).toHaveBeenCalledWith({
        email: mockUserDoc.email,
      });
    });

    it('should throw error when user not found', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(
        service.findOneByEmail('missing@example.com'),
      ).rejects.toThrow('User with email missing@example.com not found');
    });
  });

  describe('findOneByEmailWithPassword', () => {
    it('should return a user with password', async () => {
      const mockSelect = jest.fn().mockResolvedValue(mockUserDoc);
      userModel.findOne.mockReturnValue({
        select: mockSelect,
      } as unknown as ReturnType<typeof userModel.findOne>);
      const result = await service.findOneByEmailWithPassword(
        mockUserDoc.email,
      );

      expect(result).toEqual(mockUserDoc);
      expect(userModel.findOne).toHaveBeenCalledWith({
        email: mockUserDoc.email,
      });
      expect(mockSelect).toHaveBeenCalledWith('+password');
    });

    it('should throw error when user not found', async () => {
      const mockSelect = jest.fn().mockResolvedValue(null);
      userModel.findOne.mockReturnValue({
        select: mockSelect,
      } as unknown as ReturnType<typeof userModel.findOne>);

      await expect(
        service.findOneByEmailWithPassword('missing@example.com'),
      ).rejects.toThrow('User with email missing@example.com not found');
    });
  });

  describe('getUserInfoById', () => {
    it('should return detailed user info with totals', async () => {
      userModel.findById.mockResolvedValue(mockUserDoc);
      bookingModel.find.mockResolvedValue(mockBookings);

      const result = await service.getUserInfoById(mockUserDoc._id.toString());

      expect(result).toEqual({
        userId: mockUserDoc._id.toString(),
        fullName: mockUserDoc.fullName,
        email: mockUserDoc.email,
        phone: mockUserDoc.phone,
        role: mockUserDoc.role,
        createdAt: mockUserDoc.createdAt,
        updatedAt: mockUserDoc.updatedAt,
        totalMoviesBooked: 2,
        totalSeatsBooked: 3,
        totalMoneySpent: 450,
      });
      expect(bookingModel.find).toHaveBeenCalledWith({
        email: mockUserDoc.email,
      });
    });

    it('should throw error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      await expect(service.getUserInfoById('missing-id')).rejects.toThrow(
        'User with id missing-id not found',
      );
    });
  });

  describe('updateHashedRefreshToken', () => {
    it('should update hashed refresh token', async () => {
      userModel.findByIdAndUpdate.mockResolvedValue(mockUserDoc as any);

      await service.updateHashedRefreshToken('user-id-1', 'hashed-token');

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('user-id-1', {
        hashedRefreshToken: 'hashed-token',
      });
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+380123456789',
      };

      const mockSave = jest.fn().mockResolvedValue(true);
      const mockUserInstance = {
        _id: mockUserDoc._id,
        fullName: createUserDto.fullName,
        email: createUserDto.email,
        role: Role.User,
        save: mockSave,
      };

      const userModelConstructor = service['userModel'] as unknown as jest.Mock;
      userModelConstructor.mockReturnValue(mockUserInstance);
      userModel.findOne.mockResolvedValue(null);

      const result = await service.createUser(createUserDto);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
      expect(userModelConstructor).toHaveBeenCalledWith(createUserDto);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual({
        _id: mockUserDoc._id,
        fullName: createUserDto.fullName,
        email: createUserDto.email,
        role: Role.User,
      });
    });

    it('should throw error when user data is invalid', async () => {
      await expect(
        service.createUser(null as unknown as CreateUserDto),
      ).rejects.toThrow('Invalid user data');
    });

    it('should throw error when email already exists', async () => {
      userModel.findOne.mockResolvedValue(mockUserDoc);

      await expect(
        service.createUser({
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          phone: '+380123456789',
        }),
      ).rejects.toThrow('User with this email already exists');
    });
  });
});
