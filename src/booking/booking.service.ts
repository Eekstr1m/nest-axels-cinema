import { Injectable } from '@nestjs/common';
import { Booking } from './booking.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
  ) {}

  async create(bookingData: CreateBookingDto) {
    const newBooking = new this.bookingModel(bookingData);
    await newBooking.save();
    return newBooking;
  }
}
