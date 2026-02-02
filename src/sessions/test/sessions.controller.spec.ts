import { Test, TestingModule } from '@nestjs/testing';
import { SessionsController } from '../sessions.controller';
import { SessionsService } from '../sessions.service';
import mongoose from 'mongoose';
import { SessionsDocument } from '../schema/sessions.schema';
import { Session } from '../entity/session.entity';
import { Movies } from '../../movies/entity/movie.entity';
import { NotFoundException } from '@nestjs/common';

const mockSessionMongo = {
  _id: new mongoose.Types.ObjectId(),
  movieId: new mongoose.Types.ObjectId(),
  date: '2026-02-01',
  startTime: '18:00',
  price: 250,
  seats: [
    [
      { row: 1, number: 1, isBooked: false },
      { row: 1, number: 2, isBooked: false },
    ],
    [
      { row: 2, number: 1, isBooked: false },
      { row: 2, number: 2, isBooked: true },
    ],
  ],
} as SessionsDocument;

const mockMovie: Movies = {
  _id: 1,
  title: 'Test Movie',
  description: 'Test Description',
  posterUrl: 'https://example.com/poster.jpg',
  duration: 120,
  genres: ['Action'],
  releaseDate: new Date('2014-01-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
  sessions: [],
};

const mockSessionSql: Session = {
  _id: 1,
  movie: mockMovie,
  date: '2026-02-01',
  startTime: '19:00',
  price: 250,
  seats: [],
  bookings: [],
};

const mockSessionDates = ['2026-02-01', '2026-02-02', '2026-02-03'];

describe('SessionsController', () => {
  let controller: SessionsController;
  let service: SessionsService;

  const mockSessionsService = {
    findByMovieId: jest.fn().mockResolvedValue([mockSessionMongo]),
    findByMovieIdSql: jest.fn().mockResolvedValue([mockSessionSql]),
    findSessionsByDateForMovie: jest.fn().mockResolvedValue([mockSessionMongo]),
    findSessionsByDateForMovieSql: jest
      .fn()
      .mockResolvedValue([mockSessionSql]),
    findSessionsDatesForMovie: jest.fn().mockResolvedValue(mockSessionDates),
    findSessionsDatesForMovieSql: jest.fn().mockResolvedValue(mockSessionDates),
    findSessionById: jest.fn().mockResolvedValue(mockSessionMongo),
    findSessionByIdSql: jest.fn().mockResolvedValue(mockSessionSql),
    generateSessions: jest
      .fn()
      .mockResolvedValue({ message: 'Sessions generated successfully' }),
    generateSessionsSql: jest
      .fn()
      .mockResolvedValue({ message: 'Sessions generated successfully' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        {
          provide: SessionsService,
          useValue: mockSessionsService,
        },
      ],
    }).compile();

    controller = module.get<SessionsController>(SessionsController);
    service = module.get<SessionsService>(SessionsService);

    jest.clearAllMocks();
  });

  describe('findByMovieId', () => {
    it('should return an array of sessions for a movie', async () => {
      const movieId = mockSessionMongo.movieId;
      const result = await controller.findByMovieId(movieId);

      expect(result).toEqual([mockSessionMongo]);
      expect(service.findByMovieId).toHaveBeenCalledWith(movieId);
    });

    it('should throw NotFoundException on error', async () => {
      const movieId = new mongoose.Types.ObjectId();
      mockSessionsService.findByMovieId.mockRejectedValue(
        new Error('Sessions not found'),
      );

      await expect(controller.findByMovieId(movieId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByMovieIdSql', () => {
    it('should return an array of sessions from SQL', async () => {
      const movieId = mockSessionSql.movie._id;
      const result = await controller.findByMovieIdSql(movieId);

      expect(result).toEqual([mockSessionSql]);
      expect(service.findByMovieIdSql).toHaveBeenCalledWith(movieId);
    });

    it('should throw NotFoundException on error', async () => {
      const movieId = 999;
      mockSessionsService.findByMovieIdSql.mockRejectedValue(
        new Error('Sessions not found'),
      );

      await expect(controller.findByMovieIdSql(movieId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findSessionsByDateForMovie', () => {
    it('should return sessions for a specific date and movie', async () => {
      const movieId = mockSessionMongo.movieId;
      const date = '2026-02-01';
      const result = await controller.findSessionsByDateForMovie(movieId, date);

      expect(result).toEqual([mockSessionMongo]);
      expect(service.findSessionsByDateForMovie).toHaveBeenCalledWith(
        movieId,
        date,
      );
    });

    it('should throw NotFoundException on error', async () => {
      const movieId = new mongoose.Types.ObjectId();
      const date = '2026-02-01';
      mockSessionsService.findSessionsByDateForMovie.mockRejectedValue(
        new Error('Sessions not found'),
      );

      await expect(
        controller.findSessionsByDateForMovie(movieId, date),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findSessionsByDateForMovieSql', () => {
    it('should return sessions from SQL for a specific date and movie', async () => {
      const movieId = mockSessionSql.movie._id;
      const date = '2026-02-01';
      const result = await controller.findSessionsByDateForMovieSql(
        movieId,
        date,
      );

      expect(result).toEqual([mockSessionSql]);
      expect(service.findSessionsByDateForMovieSql).toHaveBeenCalledWith(
        movieId,
        date,
      );
    });

    it('should throw NotFoundException on error', async () => {
      const movieId = 999;
      const date = '2026-02-01';
      mockSessionsService.findSessionsByDateForMovieSql.mockRejectedValue(
        new Error('Sessions not found'),
      );

      await expect(
        controller.findSessionsByDateForMovieSql(movieId, date),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findSessionsDatesForMovie', () => {
    it('should return available dates for movie sessions', async () => {
      const movieId = mockSessionMongo.movieId;
      const result = await controller.findSessionsDatesForMovie(movieId);

      expect(result).toEqual(mockSessionDates);
      expect(service.findSessionsDatesForMovie).toHaveBeenCalledWith(movieId);
    });

    it('should throw NotFoundException on error', async () => {
      const movieId = new mongoose.Types.ObjectId();
      mockSessionsService.findSessionsDatesForMovie.mockRejectedValue(
        new Error('Sessions dates not found'),
      );

      await expect(
        controller.findSessionsDatesForMovie(movieId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findSessionsDatesForMovieSql', () => {
    it('should return available dates from SQL for movie sessions', async () => {
      const movieId = mockSessionSql.movie._id;
      const result = await controller.findSessionsDatesForMovieSql(movieId);

      expect(result).toEqual(mockSessionDates);
      expect(service.findSessionsDatesForMovieSql).toHaveBeenCalledWith(
        movieId,
      );
    });

    it('should throw NotFoundException on error', async () => {
      const movieId = 999;
      mockSessionsService.findSessionsDatesForMovieSql.mockRejectedValue(
        new Error('Sessions dates not found'),
      );

      await expect(
        controller.findSessionsDatesForMovieSql(movieId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findSessionById', () => {
    it('should return a session by id', async () => {
      const sessionId = mockSessionMongo._id;
      const result = await controller.findSessionById(sessionId);

      expect(result).toEqual(mockSessionMongo);
      expect(service.findSessionById).toHaveBeenCalledWith(sessionId);
    });

    it('should throw NotFoundException on error', async () => {
      const sessionId = new mongoose.Types.ObjectId();
      mockSessionsService.findSessionById.mockRejectedValue(
        new Error('Session not found'),
      );

      await expect(controller.findSessionById(sessionId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findSessionByIdSql', () => {
    it('should return a session by SQL id', async () => {
      const sessionId = mockSessionSql._id;
      const result = await controller.findSessionByIdSql(sessionId);

      expect(result).toEqual(mockSessionSql);
      expect(service.findSessionByIdSql).toHaveBeenCalledWith(sessionId);
    });

    it('should throw NotFoundException on error', async () => {
      const sessionId = 999;
      mockSessionsService.findSessionByIdSql.mockRejectedValue(
        new Error('Session not found'),
      );

      await expect(controller.findSessionByIdSql(sessionId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('generateSessions', () => {
    it('should generate sessions successfully', async () => {
      const result = await controller.generateSessions();

      expect(result).toEqual({ message: 'Sessions generated successfully' });
      expect(service.generateSessions).toHaveBeenCalled();
    });

    it('should throw NotFoundException on error', async () => {
      mockSessionsService.generateSessions.mockRejectedValue(
        new Error('Sessions not generated'),
      );

      await expect(controller.generateSessions()).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('generateSessionsSql', () => {
    it('should generate SQL sessions successfully', async () => {
      const result = await controller.generateSessionsSql();

      expect(result).toEqual({ message: 'Sessions generated successfully' });
      expect(service.generateSessionsSql).toHaveBeenCalled();
    });

    it('should throw NotFoundException on error', async () => {
      mockSessionsService.generateSessionsSql.mockRejectedValue(
        new Error('Sessions not generated'),
      );

      await expect(controller.generateSessionsSql()).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
