import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

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
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Booking not created',
      );
    }
  }
}
