import { Bookings } from 'src/booking/entity/bookings.entity';
import { Movies } from 'src/movies/entity/movie.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Seat } from './seat.entity';

@Entity()
export class Session {
  @PrimaryGeneratedColumn()
  _id: number;

  @ManyToOne(() => Movies, (movies) => movies.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie: Movies;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @OneToMany(() => Seat, (seat) => seat.session)
  seats: Seat[];

  @OneToMany(() => Bookings, (booking) => booking.session)
  bookings: Bookings[];
}
