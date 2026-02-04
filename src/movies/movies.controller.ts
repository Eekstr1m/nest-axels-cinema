import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Role } from 'src/auth/enums/role.enum';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { CreateMovieDto } from './dto/create-movie.dto';
import { MoviesService } from './movies.service';

@Controller('movies')
export class MoviesController {
  constructor(private movieService: MoviesService) {}

  // GET /movies
  @Get()
  async findAll() {
    try {
      return await this.movieService.findAll();
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Movies not found',
      );
    }
  }

  // GET /movies/sql
  @Get('sql')
  async findAllSql() {
    try {
      return await this.movieService.findAllSql();
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Movies not found',
      );
    }
  }

  // GET /movies/sql/:id
  @Get('sql/:id')
  async findOneSql(@Param('id') id: number) {
    try {
      return await this.movieService.findOneSql(id);
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

  // POST /movies/sql
  @Roles(Role.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @Post('sql')
  @HttpCode(HttpStatus.CREATED)
  async createSql(@Body() movie: CreateMovieDto) {
    try {
      return await this.movieService.createSql(movie);
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Error creating movie',
      );
    }
  }

  // POST /movies
  @Roles(Role.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() movie: CreateMovieDto) {
    try {
      return await this.movieService.create(movie);
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Error creating movie',
      );
    }
  }
}
