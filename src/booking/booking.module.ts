import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingSeat } from './entity/bookings-seat.entity';
import { Bookings } from './entity/bookings.entity';
import { Booking, BookingSchema } from './schema/booking.schema';
import { Seat } from 'src/sessions/entity/seat.entity';
import { Session } from 'src/sessions/entity/session.entity';
import { Sessions, SessionsSchema } from 'src/sessions/schema/sessions.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Sessions.name, schema: SessionsSchema },
    ]),
    TypeOrmModule.forFeature([Bookings, BookingSeat, Seat, Session]),
  ],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
