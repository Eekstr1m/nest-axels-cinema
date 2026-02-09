import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movies } from 'src/movies/entity/movie.entity';
import { Session } from 'src/sessions/entity/session.entity';
import { Seat } from 'src/sessions/entity/seat.entity';
import { Bookings } from 'src/booking/entity/bookings.entity';
import { BookingSeat } from 'src/booking/entity/bookings-seat.entity';

export const getTestDatabaseModules = () => [
  ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
  MongooseModule.forRoot(process.env.MONGO_URI_TEST || ''),
  TypeOrmModule.forRoot({
    type: 'mysql',
    host: process.env.MYSQL_DB_HOST || '',
    port: parseInt(process.env.MYSQL_DB_PORT || ''),
    username: process.env.MYSQL_DB_USER || '',
    password: process.env.MYSQL_DB_PASSWORD || '',
    database: process.env.MYSQL_DB_NAME_TEST || '',
    entities: [Movies, Session, Seat, Bookings, BookingSeat],
    synchronize: true,
    retryAttempts: 0,
  }),
];
