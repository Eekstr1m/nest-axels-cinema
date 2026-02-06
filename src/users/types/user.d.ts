import { Role } from 'src/auth/enums/role.enum';

export interface DetailedUser {
  userId: string;
  fullName: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  totalMoviesBooked: number;
  totalSeatsBooked: number;
  totalMoneySpent: number;
}
