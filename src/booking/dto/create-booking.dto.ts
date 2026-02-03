import mongoose from 'mongoose';
import { SeatDocument } from 'src/sessions/schema/sessions.schema';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsArray,
  IsMongoId,
  IsDateString,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

class SeatDto {
  @IsInt()
  row: number;

  @IsInt()
  number: number;
}

export class CreateBookingDto {
  @IsMongoId()
  @IsNotEmpty()
  sessionId: mongoose.Types.ObjectId;

  @IsMongoId()
  @IsNotEmpty()
  movieId: mongoose.Types.ObjectId;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsArray()
  @IsNotEmpty()
  bookedSeats: SeatDocument[];

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  pricePerSeat: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  totalPrice: number;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class CreateBookingSqlDto {
  @IsNumber()
  @IsNotEmpty()
  sessionId: number;

  @IsNumber()
  @IsNotEmpty()
  movieId: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SeatDto)
  bookedSeats: SeatDto[];

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsNumber()
  @IsPositive()
  pricePerSeat: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  totalPrice: number;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
