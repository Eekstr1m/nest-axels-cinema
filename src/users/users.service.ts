import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findOneById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);

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

  async createUser(
    user: CreateUserDto,
  ): Promise<Omit<UserDocument, 'password'>> {
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

    return userWithoutPassword as Omit<UserDocument, 'password'>;
  }
}
