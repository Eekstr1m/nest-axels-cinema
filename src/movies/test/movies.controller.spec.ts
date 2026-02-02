import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { MoviesController } from '../movies.controller';
import { MoviesService } from '../movies.service';
import { MovieDocument } from '../schema/movies.schema';
import { Movies } from '../entity/movie.entity';
import { CreateMovieDto } from '../dto/create-movie.dto';

const mockMovieMongo = {
  _id: new mongoose.Types.ObjectId(),
  title: 'Inception',
  description: 'A thief who steals corporate secrets.',
  posterUrl: 'http://example.com/poster.jpg',
  duration: 148,
  genres: ['Action', 'Sci-Fi'],
  releaseDate: new Date('2010-07-16'),
} as MovieDocument;

const mockMovieSql: Movies = {
  _id: 1,
  title: 'Inception',
  description: 'A thief who steals corporate secrets.',
  posterUrl: 'http://example.com/poster.jpg',
  duration: 148,
  genres: ['Action', 'Sci-Fi'],
  releaseDate: new Date('2010-07-16'),
  createdAt: new Date(),
  updatedAt: new Date(),
  sessions: [],
};

const mockCreateMovieDto: CreateMovieDto = {
  title: 'Inception',
  description: 'A thief who steals corporate secrets.',
  posterUrl: 'http://example.com/poster.jpg',
  duration: 148,
  genres: ['Action', 'Sci-Fi'],
  releaseDate: new Date('2010-07-16'),
};

describe('MoviesController', () => {
  let controller: MoviesController;
  let service: MoviesService;

  const mockMovieService = {
    findAll: jest.fn().mockResolvedValue([mockMovieMongo]),
    findAllSql: jest.fn().mockResolvedValue([mockMovieSql]),
    findOne: jest.fn().mockResolvedValue(mockMovieMongo),
    findOneSql: jest.fn().mockResolvedValue(mockMovieSql),
    create: jest.fn().mockResolvedValue(mockMovieMongo),
    createSql: jest.fn().mockResolvedValue(mockMovieSql),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMovieService,
        },
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    service = module.get<MoviesService>(MoviesService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of movies', async () => {
      const result = await controller.findAll();

      expect(result).toEqual([mockMovieMongo]);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should throw NotFoundException on error', async () => {
      try {
        await controller.findAll();
        mockMovieService.findAll.mockRejectedValue(
          new Error('Movies not found'),
        );
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('Movies not found');
      }
    });
  });

  describe('findAllSql', () => {
    it('should return an array of movies from SQL', async () => {
      const result = await controller.findAllSql();
      expect(result).toEqual([mockMovieSql]);
      expect(service.findAllSql).toHaveBeenCalled();
    });

    it('should throw NotFoundException on error', async () => {
      try {
        await controller.findAllSql();
        mockMovieService.findAllSql.mockRejectedValue(
          new Error('Movies not found'),
        );
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('Movies not found');
      }
    });
  });

  describe('findOne', () => {
    it('should return a movie by id', async () => {
      const result = await controller.findOne(mockMovieMongo._id);

      expect(result).toEqual(mockMovieMongo);
      expect(service.findOne).toHaveBeenCalledWith(mockMovieMongo._id);
    });

    it('should throw NotFoundException on error', async () => {
      try {
        await controller.findOne(mockMovieMongo._id);
        mockMovieService.findOne.mockRejectedValue(
          new Error('Movie not found'),
        );
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('Movie not found');
      }
    });
  });

  describe('findOneSql', () => {
    it('should return a movie by SQL id', async () => {
      const result = await controller.findOneSql(mockMovieSql._id);
      expect(result).toEqual(mockMovieSql);
      expect(service.findOneSql).toHaveBeenCalledWith(mockMovieSql._id);
    });

    it('should throw NotFoundException on error', async () => {
      try {
        await controller.findOneSql(mockMovieSql._id);
        mockMovieService.findOneSql.mockRejectedValue(
          new Error('Movie not found'),
        );
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('Movie not found');
      }
    });
  });

  describe('create', () => {
    it('should create and return a movie', async () => {
      const result = await controller.create(mockCreateMovieDto);

      expect(result).toEqual(mockMovieMongo);
      expect(service.create).toHaveBeenCalledWith(mockCreateMovieDto);
    });

    it('should throw NotFoundException on error', async () => {
      try {
        await controller.create(mockCreateMovieDto);
        mockMovieService.create.mockRejectedValue(
          new Error('Invalid movie data'),
        );
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('Invalid movie data');
      }
    });
  });

  describe('createSql', () => {
    it('should create and return a movie in SQL', async () => {
      const result = await controller.createSql(mockCreateMovieDto);
      expect(result).toEqual(mockMovieSql);
      expect(service.createSql).toHaveBeenCalledWith(mockCreateMovieDto);
    });

    it('should throw NotFoundException on error', async () => {
      try {
        await controller.createSql(mockCreateMovieDto);
        mockMovieService.createSql.mockRejectedValue(
          new Error('Invalid movie data'),
        );
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('Invalid movie data');
      }
    });
  });
});
