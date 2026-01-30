import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import {
  CreateBookingDto,
  CreateBookingSqlDto,
} from './dto/create-booking.dto';

@Controller('booking')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  // POST /booking
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() bookingData: CreateBookingDto) {
    try {
      return await this.bookingService.create(bookingData);
    } catch (error) {
      console.error('Booking creation error:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Booking not created',
      );
    }
  }

  // POST /booking/sql
  @Post('sql')
  @HttpCode(HttpStatus.CREATED)
  async createSql(@Body() bookingData: CreateBookingSqlDto) {
    try {
      console.log(
        'Received booking data:',
        JSON.stringify(bookingData, null, 2),
      );
      return await this.bookingService.createSql(bookingData);
    } catch (error) {
      console.error('SQL Booking creation error:', error);
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Booking not created');
    }
  }
}
