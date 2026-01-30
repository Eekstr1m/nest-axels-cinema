import { Movies } from 'src/movies/entity/movie.entity';
import { Session } from 'src/sessions/entity/session.entity';
import {
  UpdateDateColumn,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BookingSeat } from './bookings-seat.entity';

@Entity()
export class Bookings {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Session, (session) => session.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @ManyToOne(() => Movies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie: Movies;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  time: string;

  @Column('decimal', { name: 'price_per_seat', precision: 10, scale: 2 })
  pricePerSeat: number;

  @Column('decimal', { name: 'total_price', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 50 })
  phone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => BookingSeat, (bs) => bs.booking)
  bookingSeats: BookingSeat[];
}
