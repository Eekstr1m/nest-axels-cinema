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

export class CreateBookingSqlDto {
  @IsNumber()
  @IsNotEmpty()
  sessionId: number;

  @IsNumber()
  @IsNotEmpty()
  movieId: number;

  @IsDateString()
  date: string;

  @IsArray()
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
