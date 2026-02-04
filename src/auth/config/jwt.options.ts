import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtModuleOptions = (config: ConfigService): JwtModuleOptions => ({
  global: true,
  secret: config.getOrThrow('JWT_SECRET'),
  signOptions: {
    expiresIn: config.getOrThrow('JWT_SECRET_EXPIRE'),
  },
});
