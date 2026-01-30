import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sessions, SessionsSchema } from './schema/sessions.schema';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { Movie, MoviesSchema } from 'src/movies/schema/movies.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entity/session.entity';
import { Seat } from './entity/seat.entity';
import { Movies } from 'src/movies/entity/movie.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sessions.name, schema: SessionsSchema },
      { name: Movie.name, schema: MoviesSchema },
    ]),
    TypeOrmModule.forFeature([Session, Seat, Movies]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
