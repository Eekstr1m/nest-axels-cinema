import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { refreshJwtSignOptions } from './config/refresh-jwt.options';
import { AuthJwtPayload } from './types/auth-jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ id: string; accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findOneByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException();

    const isPasswordMatch = await compare(password, user.password);
    if (!isPasswordMatch) throw new UnauthorizedException();

    const payload: AuthJwtPayload = {
      sub: user._id.toString(),
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(
      payload,
      refreshJwtSignOptions(this.configService),
    );

    return { id: user._id.toString(), accessToken, refreshToken };
  }

  async refreshToken(
    userId: string,
  ): Promise<{ id: string; accessToken: string }> {
    const user = await this.usersService.findOneById(userId);
    if (!user) throw new UnauthorizedException();

    const payload: AuthJwtPayload = {
      sub: user._id.toString(),
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return { id: user._id.toString(), accessToken };
  }
}
