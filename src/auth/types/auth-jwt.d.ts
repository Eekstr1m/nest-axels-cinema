import { Role } from '../enums/role.enum';

export type AuthJwtPayload = {
  sub: string;
  role: Role;
};

export type ValidatedJwtUser = {
  userId: string;
  role: Role;
};
