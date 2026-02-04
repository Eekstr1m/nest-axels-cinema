import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';

export const refreshJwtModuleOptions = (
  config: ConfigService,
): JwtModuleOptions => ({
  global: true,
  secret: config.getOrThrow('REFRESH_JWT_SECRET'),
  signOptions: {
    expiresIn: config.getOrThrow('REFRESH_JWT_SECRET_EXPIRE'),
  },
});

export const refreshJwtSignOptions = (
  config: ConfigService,
): JwtSignOptions => ({
  secret: config.getOrThrow('REFRESH_JWT_SECRET'),
  expiresIn: config.getOrThrow('REFRESH_JWT_SECRET_EXPIRE'),
});
