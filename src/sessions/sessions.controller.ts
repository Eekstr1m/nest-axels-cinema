import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  // GET /sessions/movie/:movieId
  @Get('movie/:movieId')
  async findByMovieId(@Param('movieId') movieId: string) {
    try {
      return await this.sessionsService.findByMovieId(movieId);
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Sessions not found',
      );
    }
  }

  // GET /sessions/movie/:movieId/date/:date
  @Get('movie/:movieId/date/:date')
  async findSessionsByDateForMovie(
    @Param('movieId') movieId: string,
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

  // GET /sessions/movie/:movieId/dates
  @Get('movie/:movieId/dates')
  async findSessionsDatesForMovie(@Param('movieId') movieId: string) {
    try {
      return await this.sessionsService.findSessionsDatesForMovie(movieId);
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Sessions dates not found',
      );
    }
  }

  // GET /sessions/:sessionId
  @Get(':sessionId')
  async findSessionById(@Param('sessionId') sessionId: string) {
    try {
      return await this.sessionsService.findSessionById(sessionId);
    } catch (error) {
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Session not found',
      );
    }
  }
}
