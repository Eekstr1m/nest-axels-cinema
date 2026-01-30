import { Injectable } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Movie, MovieDocument } from './schema/movies.schema';
import mongoose, { Model } from 'mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Movies } from './entity/movie.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MoviesService {
  constructor(
    @InjectModel(Movie.name) private movieModel: Model<Movie>,
    @InjectRepository(Movies) private moviesRepository: Repository<Movies>,
  ) {}

  async findAll(): Promise<MovieDocument[]> {
    const movies = await this.movieModel.find();

    if (!movies || movies.length === 0) {
      throw new Error('No movies available');
    }

    return movies;
  }

  async findAllSql() {
    const movies = await this.moviesRepository.find();

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

  async findOneSql(id: number) {
    const movie = await this.moviesRepository.findOneBy({ _id: id });

    if (!movie) {
      throw new Error(`Movie with id ${id} not found`);
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

  async createSql(movie: CreateMovieDto) {
    if (!movie) {
      throw new Error('Invalid movie data');
    }

    const newMovie = this.moviesRepository.create(movie);

    await this.moviesRepository.save(newMovie);
    return newMovie;
  }
}
