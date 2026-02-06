import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { HydratedDocument } from 'mongoose';
import { Role } from 'src/auth/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  fullName!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ select: false })
  hashedRefreshToken?: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ type: String, enum: Role, default: Role.User })
  role!: Role;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UsersSchema = SchemaFactory.createForClass(User);

UsersSchema.pre('save', async function () {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});
