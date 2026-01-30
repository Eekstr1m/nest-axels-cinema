import { Injectable } from '@nestjs/common';
import { Booking } from './schema/booking.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  CreateBookingDto,
  CreateBookingSqlDto,
} from './dto/create-booking.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Bookings } from './entity/bookings.entity';
import { BookingSeat } from './entity/bookings-seat.entity';
import { Seat } from 'src/sessions/entity/seat.entity';
import { DataSource, Repository } from 'typeorm';
import { Sessions } from 'src/sessions/schema/sessions.schema';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel(Sessions.name) private sessionsModel: Model<Sessions>,

    @InjectRepository(Bookings) private bookingRepository: Repository<Bookings>,
    @InjectRepository(BookingSeat)
    private bookingSeatRepository: Repository<BookingSeat>,
    @InjectRepository(Seat) private seatRepository: Repository<Seat>,
    private dataSource: DataSource,
  ) {}

  async create(bookingData: CreateBookingDto) {
    // Find the session to update seats
    const session = await this.sessionsModel.findById(bookingData.sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Mark seats as booked in the session
    for (const rowSeats of bookingData.bookedSeats) {
      for (const bookedSeat of rowSeats) {
        let seatFound = false;

        for (const row of session.seats) {
          for (const seat of row) {
            if (
              seat.row === bookedSeat.row &&
              seat.number === bookedSeat.number
            ) {
              if (seat.isBooked) {
                throw new Error(
                  `Seat row ${seat.row}, number ${seat.number} is already booked`,
                );
              }
              seat.isBooked = true;
              seatFound = true;
              break;
            }
          }
          if (seatFound) break;
        }

        if (!seatFound) {
          throw new Error(
            `Seat row ${bookedSeat.row}, number ${bookedSeat.number} not found`,
          );
        }
      }
    }

    // Save updated session with booked seats
    await session.save();

    // Create booking
    const newBooking = new this.bookingModel(bookingData);
    await newBooking.save();

    return newBooking;
  }

  async createSql(bookingData: CreateBookingSqlDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create booking
      const newBooking = this.bookingRepository.create({
        session: { _id: bookingData.sessionId },
        movie: { _id: bookingData.movieId },
        date: bookingData.date,
        time: bookingData.time,
        pricePerSeat: bookingData.pricePerSeat,
        totalPrice: bookingData.totalPrice,
        fullName: bookingData.fullName,
        email: bookingData.email,
        phone: bookingData.phone,
      });

      const savedBooking = await queryRunner.manager.save(newBooking);

      // Find and book seats
      for (const seatData of bookingData.bookedSeats) {
        const seat = await this.seatRepository.findOne({
          where: {
            session: { _id: bookingData.sessionId },
            rowNumber: seatData.row,
            seatNumber: seatData.number,
          },
        });

        if (!seat) {
          throw new Error(
            `Seat row ${seatData.row}, number ${seatData.number} not found`,
          );
        }

        if (seat.isBooked) {
          throw new Error(
            `Seat row ${seatData.row}, number ${seatData.number} is already booked`,
          );
        }

        // Mark seat as booked
        seat.isBooked = true;
        await queryRunner.manager.save(seat);

        // Create booking-seat relation
        const bookingSeat = this.bookingSeatRepository.create({
          bookingId: savedBooking.id,
          seatId: seat.id,
        });
        await queryRunner.manager.save(bookingSeat);
      }

      await queryRunner.commitTransaction();

      return savedBooking;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error creating booking:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
