import mongoose from 'mongoose';
import { SeatDocument } from 'src/sessions/sessions.schema';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsArray,
  IsMongoId,
  IsDateString,
} from 'class-validator';

export class CreateBookingDto {
  @IsMongoId()
  sessionId: mongoose.Types.ObjectId;

  @IsMongoId()
  movieId: mongoose.Types.ObjectId;

  @IsDateString()
  date: string;

  @IsArray()
  @IsNotEmpty()
  bookedSeats: SeatDocument[][];

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsNumber()
  @IsPositive()
  pricePerSeat: number;

  @IsNumber()
  @IsPositive()
  totalPrice: number;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
