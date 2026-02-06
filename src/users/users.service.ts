import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { Booking } from 'src/booking/schema/booking.schema';
import { DetailedUser } from './types/user';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
  ) {}

  async findOneById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    return user;
  }

  async findOneByIdWithToken(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(id)
      .select('+hashedRefreshToken');

    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    return user;
  }

  async findOneByEmailWithPassword(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email }).select('+password');

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    return user;
  }

  async getUserInfoById(id: string): Promise<DetailedUser> {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    const userBookings = await this.bookingModel.find({ email: user.email });

    const totalMoviesBooked = userBookings.length;
    const totalSeatsBooked = userBookings.reduce(
      (total, booking) => total + booking.bookedSeats.length,
      0,
    );
    const totalMoneySpent = userBookings.reduce(
      (total, booking) => total + booking.totalPrice,
      0,
    );

    const detailedUser = {
      userId: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      totalMoviesBooked,
      totalSeatsBooked,
      totalMoneySpent,
    };
    return detailedUser;
  }

  async updateHashedRefreshToken(userId: string, hashedRefreshToken: string) {
    return await this.userModel.findByIdAndUpdate(userId, {
      hashedRefreshToken,
    });
  }

  async createUser(
    user: CreateUserDto,
  ): Promise<Omit<UserDocument, 'password' | 'hashedRefreshToken'>> {
    if (!user) {
      throw new Error('Invalid user data');
    }

    const findExisting = await this.userModel.findOne({ email: user.email });

    if (findExisting) {
      throw new Error('User with this email already exists');
    }

    const newUser = new this.userModel(user);
    await newUser.save();

    const userWithoutPassword = {
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
    };

    return userWithoutPassword as Omit<
      UserDocument,
      'password' | 'hashedRefreshToken'
    >;
  }
}
