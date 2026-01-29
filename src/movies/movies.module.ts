import { Module } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MoviesSchema } from './movies.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Movie.name, schema: MoviesSchema }]),
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
