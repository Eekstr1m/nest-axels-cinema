import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Controller('movies')
export class MoviesController {
  constructor(private movieService: MoviesService) {}

  // GET /movies
  @Get()
  findAll() {
    try {
      return this.movieService.findAll();
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Movies not found',
      );
    }
  }

  // GET /movies/:id
  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: mongoose.Types.ObjectId) {
    try {
      return await this.movieService.findOne(id);
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Movie not found',
      );
    }
  }

  // POST /movies
  @Post()
  create(@Body() movie: CreateMovieDto) {
    try {
      return this.movieService.create(movie);
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Error creating movie',
      );
    }
  }
}
