import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from '../movies.service';
import mongoose from 'mongoose';
import { CreateMovieDto } from '../dto/create-movie.dto';
import { Movie, MovieDocument } from '../schema/movies.schema';
import { getModelToken } from '@nestjs/mongoose';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Movies } from '../entity/movie.entity';

const mockMovie = {
  _id: new mongoose.Types.ObjectId(),
  title: 'Test Movie',
  description: 'Test Description',
  posterUrl: 'https://example.com/poster.jpg',
  duration: 120,
  genres: ['Action', 'Drama'],
  releaseDate: new Date('2024-01-01'),
} as MovieDocument;

const mockMovieSql = {
  _id: 1,
  title: 'Test Movie SQL',
  description: 'Test Description SQL',
  posterUrl: 'https://example.com/poster-sql.jpg',
  duration: 130,
  genres: ['Comedy', 'Romance'],
  releaseDate: new Date('2024-02-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCreateMovieDto: CreateMovieDto = {
  title: 'New Movie',
  description: 'New Description',
  posterUrl: 'https://example.com/new-poster.jpg',
  duration: 140,
  genres: ['Thriller', 'Mystery'],
  releaseDate: new Date('2024-03-01'),
};

describe('MoviesService', () => {
  let service: MoviesService;
  let movieModel: jest.Mocked<mongoose.Model<Movie>>;
  let moviesRepository: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    const mockMovieModelInstance = {
      save: jest.fn().mockResolvedValue(mockMovie),
      _id: mockMovie._id,
      title: mockMovie.title,
      description: mockMovie.description,
      posterUrl: mockMovie.posterUrl,
      duration: mockMovie.duration,
      genres: mockMovie.genres,
      releaseDate: mockMovie.releaseDate,
    };

    movieModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      constructor: jest.fn().mockReturnValue(mockMovieModelInstance),
    } as unknown as jest.Mocked<mongoose.Model<Movie>>;

    moviesRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getModelToken(Movie.name),
          useValue: movieModel,
        },
        {
          provide: getRepositoryToken(Movies),
          useValue: moviesRepository,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  describe('findAll', () => {
    it('should return an array of movies', async () => {
      const movies = [mockMovie];
      movieModel.find.mockResolvedValue(movies);

      const result = await service.findAll();

      expect(result).toEqual(movies);
      expect(movieModel.find).toHaveBeenCalled();
    });

    it('should throw an error when no movies are available', async () => {
      movieModel.find.mockResolvedValue([]);

      await expect(service.findAll()).rejects.toThrow('No movies available');
    });

    it('should throw an error when movies is null', async () => {
      movieModel.find.mockResolvedValue(null as unknown as MovieDocument[]);

      await expect(service.findAll()).rejects.toThrow('No movies available');
    });
  });

  describe('findAllSql', () => {
    it('should return an array of movies from SQL', async () => {
      const movies = [mockMovieSql];
      moviesRepository.find.mockResolvedValue(movies);

      const result = await service.findAllSql();

      expect(result).toEqual(movies);
      expect(moviesRepository.find).toHaveBeenCalled();
    });

    it('should throw an error when no movies are available in SQL', async () => {
      moviesRepository.find.mockResolvedValue([]);

      await expect(service.findAllSql()).rejects.toThrow('No movies available');
    });

    it('should throw an error when movies is null in SQL', async () => {
      moviesRepository.find.mockResolvedValue(null as unknown as Movies[]);

      await expect(service.findAllSql()).rejects.toThrow('No movies available');
    });
  });

  describe('findOne', () => {
    it('should return a movie by id', async () => {
      movieModel.findById.mockResolvedValue(mockMovie);

      const result = await service.findOne(mockMovie._id);

      expect(result).toEqual(mockMovie);
      expect(movieModel.findById).toHaveBeenCalledWith(mockMovie._id);
    });

    it('should throw an error when movie is not found', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      movieModel.findById.mockResolvedValue(null);

      await expect(service.findOne(invalidId)).rejects.toThrow(
        `Movie with id ${invalidId.toString()} not found`,
      );
    });
  });

  describe('findOneSql', () => {
    it('should return a movie by id from SQL', async () => {
      moviesRepository.findOneBy.mockResolvedValue(mockMovieSql);

      const result = await service.findOneSql(mockMovieSql._id);

      expect(result).toEqual(mockMovieSql);
      expect(moviesRepository.findOneBy).toHaveBeenCalledWith({
        _id: mockMovieSql._id,
      });
    });

    it('should throw an error when movie is not found in SQL', async () => {
      const invalidId = 999;
      moviesRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOneSql(invalidId)).rejects.toThrow(
        `Movie with id ${invalidId} not found`,
      );
    });
  });

  describe('create', () => {
    it('should create and return a new movie', async () => {
      const mockSave = jest.fn().mockResolvedValue(mockMovie);
      const mockMovieInstance = {
        ...mockCreateMovieDto,
        save: mockSave,
      };

      const movieModelConstructor = Object.assign(
        jest.fn().mockReturnValue(mockMovieInstance),
        {
          findOne: jest.fn().mockResolvedValue(null),
        },
      );
      service['movieModel'] =
        movieModelConstructor as unknown as mongoose.Model<Movie>;

      await service.create(mockCreateMovieDto);

      expect(movieModelConstructor).toHaveBeenCalledWith(mockCreateMovieDto);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should throw an error when movie data is invalid', async () => {
      await expect(
        service.create(null as unknown as CreateMovieDto),
      ).rejects.toThrow('Invalid movie data');
    });
  });

  describe('createSql', () => {
    it('should create and return a new movie in SQL', async () => {
      moviesRepository.create.mockReturnValue(mockMovieSql);
      moviesRepository.save.mockResolvedValue(mockMovieSql);

      const result = await service.createSql(mockCreateMovieDto);

      expect(result).toEqual(mockMovieSql);
      expect(moviesRepository.create).toHaveBeenCalledWith(mockCreateMovieDto);
      expect(moviesRepository.save).toHaveBeenCalledWith(mockMovieSql);
    });

    it('should throw an error when movie data is invalid in SQL', async () => {
      await expect(
        service.createSql(null as unknown as CreateMovieDto),
      ).rejects.toThrow('Invalid movie data');
    });
  });
});
