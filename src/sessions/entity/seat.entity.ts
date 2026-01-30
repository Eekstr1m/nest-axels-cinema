import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Session } from './session.entity';
import { BookingSeat } from 'src/booking/entity/bookings-seat.entity';

@Entity()
@Unique(['session', 'rowNumber', 'seatNumber'])
export class Seat {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Session, (session) => session.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @Column({ name: 'row_number' })
  rowNumber: number;

  @Column({ name: 'seat_number' })
  seatNumber: number;

  @Column({ name: 'is_booked', default: false })
  isBooked: boolean;

  @OneToMany(() => BookingSeat, (bs) => bs.booking)
  bookingSeats: BookingSeat[];
}
