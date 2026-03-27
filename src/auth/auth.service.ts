import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { refreshJwtSignOptions } from './config/refresh-jwt.options';
import { AuthJwtPayload } from './types/auth-jwt';
import { Role } from './enums/role.enum';
import * as argon2 from 'argon2';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findOneByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException();

    if (!user.password) throw new UnauthorizedException();

    const isPasswordMatch = await compare(password, user.password);
    if (!isPasswordMatch) throw new UnauthorizedException();

    return { userId: user._id.toString(), role: user.role };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ id: string; accessToken: string; refreshToken: string }> {
    const { userId, role } = await this.validateUser(email, password);

    const { accessToken, refreshToken } = await this.generateTokens(
      userId,
      role,
    );

    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.usersService.updateHashedRefreshToken(
      userId,
      hashedRefreshToken,
    );

    return { id: userId, accessToken, refreshToken };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.createUser(registerDto);
    return await this.login(user.email, registerDto.password);
  }

  async generateTokens(userId: string, role: Role) {
    const payload: AuthJwtPayload = {
      sub: userId,
      role,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(
        payload,
        refreshJwtSignOptions(this.configService),
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async refreshToken(
    userId: string,
    role: Role,
  ): Promise<{ id: string; accessToken: string; refreshToken: string }> {
    const { accessToken, refreshToken } = await this.generateTokens(
      userId,
      role,
    );

    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.usersService.updateHashedRefreshToken(
      userId,
      hashedRefreshToken,
    );

    return { id: userId, accessToken, refreshToken };
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.usersService.findOneByIdWithToken(userId);
    if (!user || !user.hashedRefreshToken) throw new UnauthorizedException();

    const isRefreshTokenMatching = await argon2.verify(
      user.hashedRefreshToken,
      refreshToken,
    );
    if (!isRefreshTokenMatching) throw new UnauthorizedException();

    return { userId: user._id.toString(), role: user.role };
  }

  async logout(userId: string) {
    await this.usersService.updateHashedRefreshToken(userId, '');
  }
}
