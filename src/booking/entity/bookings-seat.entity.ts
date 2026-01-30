import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Bookings } from './bookings.entity';
import { Seat } from 'src/sessions/entity/seat.entity';

@Entity()
export class BookingSeat {
  @PrimaryColumn({ name: 'booking_id' })
  bookingId: number;

  @PrimaryColumn({ name: 'seat_id' })
  seatId: number;

  @ManyToOne(() => Bookings, (booking) => booking.bookingSeats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking: Bookings;

  @ManyToOne(() => Seat, (seat) => seat.bookingSeats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;
}
