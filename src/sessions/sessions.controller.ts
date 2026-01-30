import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  // GET /sessions/movie/:movieId
  @Get('movie/:movieId')
  async findByMovieId(
    @Param('movieId', ParseObjectIdPipe) movieId: mongoose.Types.ObjectId,
  ) {
    try {
      return await this.sessionsService.findByMovieId(movieId);
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Sessions not found',
      );
    }
  }

  // GET /sessions/sql/movie/:movieId
  @Get('sql/movie/:movieId')
  async findByMovieIdSql(@Param('movieId') movieId: number) {
    try {
      return await this.sessionsService.findByMovieIdSql(movieId);
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Sessions not found',
      );
    }
  }

  // GET /sessions/movie/:movieId/date/:date
  @Get('movie/:movieId/date/:date')
  async findSessionsByDateForMovie(
    @Param('movieId', ParseObjectIdPipe) movieId: mongoose.Types.ObjectId,
    @Param('date') date: string,
  ) {
    try {
      return await this.sessionsService.findSessionsByDateForMovie(
        movieId,
        date,
      );
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Sessions not found',
      );
    }
  }

  // GET /sessions/sql/movie/:movieId/date/:date
  @Get('sql/movie/:movieId/date/:date')
  async findSessionsByDateForMovieSql(
    @Param('movieId') movieId: number,
    @Param('date') date: string,
  ) {
    try {
      return await this.sessionsService.findSessionsByDateForMovieSql(
        movieId,
        date,
      );
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Sessions not found',
      );
    }
  }

  // GET /sessions/movie/:movieId/dates
  @Get('movie/:movieId/dates')
  async findSessionsDatesForMovie(
    @Param('movieId', ParseObjectIdPipe) movieId: mongoose.Types.ObjectId,
  ) {
    try {
      return await this.sessionsService.findSessionsDatesForMovie(movieId);
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Sessions dates not found',
      );
    }
  }

  // GET /sessions/sql/movie/:movieId/dates
  @Get('sql/movie/:movieId/dates')
  async findSessionsDatesForMovieSql(@Param('movieId') movieId: number) {
    try {
      return await this.sessionsService.findSessionsDatesForMovieSql(movieId);
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Sessions dates not found',
      );
    }
  }

  // GET /sessions/sql/generate
  @Get('sql/generate')
  async generateSessionsSql() {
    try {
      return await this.sessionsService.generateSessionsSql();
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Sessions not generated',
      );
    }
  }

  // GET /sessions/generate
  @Get('generate')
  async generateSessions() {
    try {
      return await this.sessionsService.generateSessions();
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Sessions not generated',
      );
    }
  }

  // GET /sessions/:sessionId
  @Get(':sessionId')
  async findSessionById(
    @Param('sessionId', ParseObjectIdPipe) sessionId: mongoose.Types.ObjectId,
  ) {
    try {
      return await this.sessionsService.findSessionById(sessionId);
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Session not found',
      );
    }
  }

  // GET /sessions/sql/:sessionId
  @Get('sql/:sessionId')
  async findSessionByIdSql(@Param('sessionId') sessionId: number) {
    try {
      return await this.sessionsService.findSessionByIdSql(sessionId);
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Session not found',
      );
    }
  }
}
