import { Module } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MoviesSchema } from './schema/movies.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movies } from './entity/movie.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Movie.name, schema: MoviesSchema }]),
    TypeOrmModule.forFeature([Movies]),
    AuthModule,
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
