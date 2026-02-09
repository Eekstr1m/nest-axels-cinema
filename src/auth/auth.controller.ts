import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshJwtAuthGuard } from './guards/refresh-jwt-auth.guard';
import { ValidatedJwtUser } from './types/auth-jwt';
import { ConfigService } from '@nestjs/config';
import { type Response } from 'express';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private getRefreshCookieOptions() {
    const isProd = this.configService.get('NODE_ENV') === 'production';
    const maxAge = Number(
      this.configService.get('REFRESH_JWT_COOKIE_MAX_AGE_MS'),
    );
    const baseOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/auth/refresh',
    } as const;

    if (Number.isFinite(maxAge) && maxAge > 0) {
      return { ...baseOptions, maxAge };
    }

    return baseOptions;
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { id, accessToken, refreshToken } = await this.authService.login(
        loginDto.email,
        loginDto.password,
      );

      res.cookie('refreshToken', refreshToken, this.getRefreshCookieOptions());
      return { id, accessToken };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Login failed',
      );
    }
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { id, accessToken, refreshToken } =
        await this.authService.register(registerDto);

      res.cookie('refreshToken', refreshToken, this.getRefreshCookieOptions());
      return { id, accessToken };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'User registration failed',
      );
    }
  }

  @UseGuards(RefreshJwtAuthGuard)
  @Post('refresh')
  async refreshToken(
    @Req() { user }: { user: ValidatedJwtUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { id, accessToken, refreshToken } =
        await this.authService.refreshToken(user.userId, user.role);

      res.cookie('refreshToken', refreshToken, this.getRefreshCookieOptions());
      return { id, accessToken };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Token refresh failed',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() { user }: { user: ValidatedJwtUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      await this.authService.logout(user.userId);
      res.clearCookie('refreshToken', this.getRefreshCookieOptions());

      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Logout failed',
      );
    }
  }
}
