import { Injectable } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Movie, MovieDocument } from './movies.schema';
import mongoose, { Model } from 'mongoose';

@Injectable()
export class MoviesService {
  constructor(@InjectModel(Movie.name) private movieModel: Model<Movie>) {}

  async findAll(): Promise<MovieDocument[]> {
    const movies = await this.movieModel.find();

    if (!movies || movies.length === 0) {
      throw new Error('No movies available');
    }

    return movies;
  }

  async findOne(id: mongoose.Types.ObjectId): Promise<MovieDocument> {
    const movie = await this.movieModel.findById(id);

    if (!movie) {
      throw new Error(`Movie with id ${id.toString()} not found`);
    }

    return movie;
  }

  async create(movie: CreateMovieDto): Promise<MovieDocument> {
    if (!movie) {
      throw new Error('Invalid movie data');
    }

    const newMovie = new this.movieModel(movie);

    await newMovie.save();
    return newMovie;
  }
}
