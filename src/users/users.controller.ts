import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ValidatedJwtUser } from 'src/auth/types/auth-jwt';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() { user }: { user: ValidatedJwtUser }) {
    return this.usersService.findOneById(user.userId);
  }

  @Post('create')
  async createUser(@Body() user: CreateUserDto) {
    try {
      return await this.usersService.createUser(user);
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Error creating user',
      );
    }
  }
}
