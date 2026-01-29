import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MoviesModule } from './movies/movies.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionsService } from './sessions/sessions.service';
import { SessionsController } from './sessions/sessions.controller';
import { SessionsModule } from './sessions/sessions.module';
import { BookingController } from './booking/booking.controller';
import { BookingService } from './booking/booking.service';
import { BookingModule } from './booking/booking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    MongooseModule.forRoot(process.env.MONGO_URI || ''),
    MoviesModule,
    SessionsModule,
    BookingModule,
  ],
  controllers: [SessionsController, BookingController],
  providers: [SessionsService, BookingService],
})
export class AppModule {}
