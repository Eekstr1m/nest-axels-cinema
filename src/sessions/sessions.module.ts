import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sessions, SessionsSchema } from './sessions.schema';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { Movie, MoviesSchema } from 'src/movies/movies.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sessions.name, schema: SessionsSchema },
      { name: Movie.name, schema: MoviesSchema },
    ]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
