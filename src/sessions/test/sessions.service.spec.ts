import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from '../sessions.service';
import mongoose, { Model } from 'mongoose';
import { Sessions, SessionsDocument } from '../schema/sessions.schema';
import { Movies } from 'src/movies/entity/movie.entity';
import { Session } from '../entity/session.entity';
import { Movie, MovieDocument } from 'src/movies/schema/movies.schema';
import { getModelToken } from '@nestjs/mongoose';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Seat } from '../entity/seat.entity';

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
  populate: jest.fn().mockReturnThis(),
} as unknown as SessionsDocument;

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

const mockSessionSql = {
  _id: 1,
  movie: mockMovie,
  date: '2026-02-01',
  startTime: '18:00',
  price: 250,
  seats: [
    {
      id: 1,
      session: null,
      rowNumber: 1,
      seatNumber: 1,
      isBooked: false,
      bookingSeats: [],
    },
    {
      id: 2,
      session: null,
      rowNumber: 1,
      seatNumber: 2,
      isBooked: false,
      bookingSeats: [],
    },
  ],
  bookings: [],
} as unknown as Session;

describe('SessionsService', () => {
  let service: SessionsService;
  let sessionsModel: jest.Mocked<Model<Sessions>>;
  let movieModel: jest.Mocked<Model<Movie>>;
  let sessionsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
  };
  let moviesRepository: {
    find: jest.Mock;
  };
  let seatsRepository: {
    create: jest.Mock;
  };
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    sessionsModel = {
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([mockSessionMongo]),
        populate: jest.fn().mockResolvedValue(mockSessionMongo),
      }),
      findById: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSessionMongo),
      }),
      insertMany: jest.fn().mockResolvedValue([mockSessionMongo]),
    } as unknown as jest.Mocked<Model<Sessions>>;

    movieModel = {
      find: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<Model<Movie>>;

    sessionsRepository = {
      find: jest.fn().mockResolvedValue([mockSessionSql]),
      findOne: jest.fn().mockResolvedValue(mockSessionSql),
      create: jest.fn().mockReturnValue(mockSessionSql),
    };

    moviesRepository = {
      find: jest.fn().mockResolvedValue([mockMovie]),
    };

    seatsRepository = {
      create: jest.fn().mockReturnValue({}),
    };

    const mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn().mockResolvedValue(mockSessionSql),
      },
    };

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as unknown as jest.Mocked<DataSource>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getModelToken(Sessions.name),
          useValue: sessionsModel,
        },
        {
          provide: getModelToken(Movie.name),
          useValue: movieModel,
        },
        {
          provide: getRepositoryToken(Session),
          useValue: sessionsRepository,
        },
        {
          provide: getRepositoryToken(Movies),
          useValue: moviesRepository,
        },
        {
          provide: getRepositoryToken(Seat),
          useValue: seatsRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    jest.clearAllMocks();
  });

  describe('findByMovieId', () => {
    it('should return sessions for a movie', async () => {
      const mockFind = {
        select: jest.fn().mockResolvedValue([mockSessionMongo]),
      };
      sessionsModel.find = jest.fn().mockReturnValue(mockFind);

      const movieId = new mongoose.Types.ObjectId();
      const result = await service.findByMovieId(movieId);

      expect(result).toEqual([mockSessionMongo]);
      expect(sessionsModel.find).toHaveBeenCalledWith({ movieId: movieId });
      expect(mockFind.select).toHaveBeenCalledWith('-seats -price');
    });

    it('should throw an error when no sessions found', async () => {
      const mockFind = {
        select: jest.fn().mockResolvedValue([]),
      };
      sessionsModel.find = jest.fn().mockReturnValue(mockFind);

      const movieId = new mongoose.Types.ObjectId();

      await expect(service.findByMovieId(movieId)).rejects.toThrow(
        `No sessions found for movie id ${movieId.toString()}`,
      );
    });
  });

  describe('findByMovieIdSql', () => {
    it('should return sessions from SQL for a movie', async () => {
      const formattedSessions = [
        {
          _id: mockSessionSql._id,
          movieId: mockMovie._id,
          date: mockSessionSql.date,
          startTime: mockSessionSql.startTime,
        },
      ];
      sessionsRepository.find.mockResolvedValue([mockSessionSql]);

      const result = await service.findByMovieIdSql(mockMovie._id);

      expect(result).toEqual(formattedSessions);
      expect(sessionsRepository.find).toHaveBeenCalledWith({
        where: { movie: { _id: mockMovie._id } },
        select: ['_id', 'date', 'startTime'],
      });
    });

    it('should throw an error when no sessions found in SQL', async () => {
      sessionsRepository.find.mockResolvedValue([]);

      await expect(service.findByMovieIdSql(mockMovie._id)).rejects.toThrow(
        `No sessions found for movie id ${mockMovie._id}`,
      );
    });
  });

  describe('findSessionsByDateForMovie', () => {
    it('should return sessions for a movie on a specific date', async () => {
      const date = '2026-02-01';
      const mockFind = {
        select: jest.fn().mockResolvedValue([mockSessionMongo]),
      };
      sessionsModel.find = jest.fn().mockReturnValue(mockFind);

      const result = await service.findSessionsByDateForMovie(
        mockSessionMongo.movieId,
        date,
      );

      expect(result).toEqual([mockSessionMongo]);
      expect(sessionsModel.find).toHaveBeenCalledWith({
        movieId: mockSessionMongo.movieId,
        date: date,
      });
      expect(mockFind.select).toHaveBeenCalledWith('-seats -price');
    });

    it('should throw an error when no sessions found for date', async () => {
      const date = '2026-02-01';
      const mockFind = {
        select: jest.fn().mockResolvedValue([]),
      };
      sessionsModel.find = jest.fn().mockReturnValue(mockFind);

      await expect(
        service.findSessionsByDateForMovie(mockSessionMongo.movieId, date),
      ).rejects.toThrow(
        `No sessions found for movie id ${mockSessionMongo.movieId.toString()} on date ${date}`,
      );
    });
  });

  describe('findSessionsByDateForMovieSql', () => {
    it('should return sessions from SQL for a movie on a specific date', async () => {
      const date = '2026-02-01';
      const formattedSessions = [
        {
          _id: mockSessionSql._id,
          movieId: mockMovie._id,
          date: mockSessionSql.date,
          startTime: mockSessionSql.startTime,
        },
      ];
      sessionsRepository.find.mockResolvedValue([mockSessionSql]);

      const result = await service.findSessionsByDateForMovieSql(
        mockMovie._id,
        date,
      );

      expect(result).toEqual(formattedSessions);
      expect(sessionsRepository.find).toHaveBeenCalledWith({
        where: { movie: { _id: mockMovie._id }, date: date },
        select: ['_id', 'date', 'startTime'],
      });
    });

    it('should throw an error when no sessions found for date in SQL', async () => {
      const date = '2026-02-01';
      sessionsRepository.find.mockResolvedValue([]);

      await expect(
        service.findSessionsByDateForMovieSql(mockMovie._id, date),
      ).rejects.toThrow(
        `No sessions found for movie id ${mockMovie._id} on date ${date}`,
      );
    });
  });

  describe('findSessionsDatesForMovie', () => {
    it('should return unique dates for movie sessions', async () => {
      const sessions = [
        { date: '2026-02-01' },
        { date: '2026-02-02' },
        { date: '2026-02-01' },
      ];
      const expectedDates = ['2026-02-01', '2026-02-02'];
      const mockFind = {
        select: jest.fn().mockResolvedValue(sessions),
      };
      sessionsModel.find = jest.fn().mockReturnValue(mockFind);

      const result = await service.findSessionsDatesForMovie(
        mockSessionMongo.movieId,
      );

      expect(result).toEqual(expectedDates);
      expect(sessionsModel.find).toHaveBeenCalledWith({
        movieId: mockSessionMongo.movieId,
      });
      expect(mockFind.select).toHaveBeenCalledWith('date -_id');
    });

    it('should throw an error when no session dates found', async () => {
      const mockFind = {
        select: jest.fn().mockResolvedValue([]),
      };
      sessionsModel.find = jest.fn().mockReturnValue(mockFind);

      await expect(
        service.findSessionsDatesForMovie(mockSessionMongo.movieId),
      ).rejects.toThrow(
        `No session dates found for movie id ${mockSessionMongo.movieId.toString()}`,
      );
    });
  });

  describe('findSessionsDatesForMovieSql', () => {
    it('should return unique dates from SQL for movie sessions', async () => {
      const sessions = [
        { date: '2026-02-01' },
        { date: '2026-02-02' },
        { date: '2026-02-01' },
      ];
      const expectedDates = ['2026-02-01', '2026-02-02'];
      sessionsRepository.find.mockResolvedValue(sessions);

      const result = await service.findSessionsDatesForMovieSql(mockMovie._id);

      expect(result).toEqual(expectedDates);
      expect(sessionsRepository.find).toHaveBeenCalledWith({
        where: { movie: { _id: mockMovie._id } },
        select: ['date'],
      });
    });

    it('should throw an error when no session dates found in SQL', async () => {
      sessionsRepository.find.mockResolvedValue([]);

      await expect(
        service.findSessionsDatesForMovieSql(mockMovie._id),
      ).rejects.toThrow(`No session dates found for movie id ${mockMovie._id}`);
    });
  });

  describe('findSessionById', () => {
    it('should return a session by id', async () => {
      const mockPopulate = jest.fn().mockResolvedValue(mockSessionMongo);
      const mockFindById = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      sessionsModel.findById = mockFindById;

      const result = await service.findSessionById(mockSessionMongo._id);

      expect(result).toEqual(mockSessionMongo);
      expect(sessionsModel.findById).toHaveBeenCalledWith(mockSessionMongo._id);
      expect(mockPopulate).toHaveBeenCalledWith({
        path: 'movieId',
        select: 'title',
      });
    });

    it('should throw an error when session not found', async () => {
      const mockPopulate = jest.fn().mockResolvedValue(null);
      const mockFindById = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      sessionsModel.findById = mockFindById;

      const invalidId = new mongoose.Types.ObjectId();

      await expect(service.findSessionById(invalidId)).rejects.toThrow(
        `Session with id ${invalidId.toString()} not found`,
      );
    });
  });

  describe('findSessionByIdSql', () => {
    it('should return a session by id from SQL', async () => {
      sessionsRepository.findOne.mockResolvedValue(mockSessionSql);

      const expectedResult = {
        _id: mockSessionSql._id,
        movieId: {
          _id: mockMovie._id,
          title: mockMovie.title,
        },
        date: mockSessionSql.date,
        startTime: mockSessionSql.startTime,
        price: mockSessionSql.price,
        seats: [
          [
            { row: 1, number: 1, isBooked: false },
            { row: 1, number: 2, isBooked: false },
          ],
        ],
      };

      const result = await service.findSessionByIdSql(mockSessionSql._id);

      expect(result).toEqual(expectedResult);
      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { _id: mockSessionSql._id },
        relations: ['movie', 'seats'],
      });
    });

    it('should throw an error when session not found', async () => {
      const invalidId = 999;
      sessionsRepository.findOne.mockResolvedValue(null);

      await expect(service.findSessionByIdSql(invalidId)).rejects.toThrow(
        `Session with id ${invalidId} not found`,
      );
    });
  });

  describe('generateSessions', () => {
    it('should generate sessions successfully', async () => {
      const mockMovies = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Test Movie',
        },
      ] as unknown as MovieDocument[];
      movieModel.find.mockResolvedValue(mockMovies);
      sessionsModel.insertMany.mockResolvedValue([
        mockSessionMongo,
      ] as unknown as SessionsDocument[]);

      const result = await service.generateSessions();

      expect(result.message).toBe('Sessions generated successfully');
      expect(movieModel.find).toHaveBeenCalled();
      expect(sessionsModel.insertMany).toHaveBeenCalled();
    });

    it('should throw an error when no movies found', async () => {
      movieModel.find.mockResolvedValue([]);

      await expect(service.generateSessions()).rejects.toThrow(
        'No movies found in database',
      );
    });
  });

  describe('generateSessionsSql', () => {
    it('should generate sessions in SQL successfully', async () => {
      moviesRepository.find.mockResolvedValue([mockMovie]);

      const result = await service.generateSessionsSql();

      expect(result.message).toBe('Sessions generated successfully');
      expect(moviesRepository.find).toHaveBeenCalled();
    });

    it('should throw an error when no movies found', async () => {
      moviesRepository.find.mockResolvedValue([]);

      await expect(service.generateSessionsSql()).rejects.toThrow(
        'No movies found in database',
      );
    });

    it('should rollback transaction on error', async () => {
      moviesRepository.find.mockRejectedValue(new Error('Database error'));
      const queryRunner = dataSource.createQueryRunner();

      await expect(service.generateSessionsSql()).rejects.toThrow(
        'Database error',
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
