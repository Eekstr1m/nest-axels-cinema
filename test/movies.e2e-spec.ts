import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MoviesModule } from 'src/movies/movies.module';
import request from 'supertest';
import { App } from 'supertest/types';
import { getTestDatabaseModules } from './test-db.config';

const movieData = {
  title: 'Test Movie',
  description: 'A test movie description',
  posterUrl: 'https://example.com/poster.jpg',
  duration: 120,
  genres: ['Action', 'Drama'],
  releaseDate: '2024-01-01',
};

describe('MoviesController (e2e)', () => {
  let app: INestApplication<App>;
  let createdMovieId: string;
  let createdSqlMovieId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [...getTestDatabaseModules(), MoviesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('MongoDB endpoints', () => {
    describe('POST /movies', () => {
      it('should return 201 and create a new movie', async () => {
        const response = await request(app.getHttpServer())
          .post('/movies')
          .send(movieData)
          .expect(201);

        expect(response.body).toHaveProperty('_id');
        expect(response.body.title).toBe(movieData.title);
        expect(response.body.description).toBe(movieData.description);
        expect(response.body.posterUrl).toBe(movieData.posterUrl);
        expect(response.body.duration).toBe(movieData.duration);
        expect(response.body.genres).toEqual(movieData.genres);

        createdMovieId = response.body._id as string;
      });

      it('should return 400 when title is missing', async () => {
        const incompleteMovieData = {
          ...movieData,
          title: undefined,
        };

        await request(app.getHttpServer())
          .post('/movies')
          .send(incompleteMovieData)
          .expect(400);
      });

      it('should return 400 when genres is empty', async () => {
        const incompleteMovieData = {
          ...movieData,
          genres: undefined,
        };

        await request(app.getHttpServer())
          .post('/movies')
          .send(incompleteMovieData)
          .expect(400);
      });

      it('should return 400 when duration is not an integer', async () => {
        const incompleteMovieData = {
          ...movieData,
          duration: 120.5,
        };

        await request(app.getHttpServer())
          .post('/movies')
          .send(incompleteMovieData)
          .expect(400);
      });
    });

    describe('GET /movies', () => {
      it('should return 200 and all movies', async () => {
        const response = await request(app.getHttpServer())
          .get('/movies')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
          expect(response.body[0]).toHaveProperty('_id');
          expect(response.body[0]).toHaveProperty('title');
          expect(response.body[0]).toHaveProperty('description');
        }
      });
    });

    describe('GET /movies/:id', () => {
      it('should return 200 and a movie by id', async () => {
        if (!createdMovieId) {
          const createResponse = await request(app.getHttpServer())
            .post('/movies')
            .send(movieData)
            .expect(201);

          createdMovieId = createResponse.body._id as string;
        }

        const response = await request(app.getHttpServer())
          .get(`/movies/${createdMovieId}`)
          .expect(200);

        expect(response.body).toHaveProperty('_id', createdMovieId);
        expect(response.body).toHaveProperty('title');
        expect(response.body).toHaveProperty('description');
      });

      it('should return 404 for non-existent id', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        await request(app.getHttpServer()).get(`/movies/${fakeId}`).expect(404);
      });

      it('should return 400 for invalid id format', async () => {
        await request(app.getHttpServer())
          .get('/movies/invalid-id')
          .expect(400);
      });
    });
  });

  describe('MySQL endpoints', () => {
    describe('POST /movies/sql', () => {
      it('should return 201 and create a new movie in SQL database', async () => {
        const response = await request(app.getHttpServer())
          .post('/movies/sql')
          .send(movieData)
          .expect(201);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('_id');
        expect(response.body.title).toBe(movieData.title);
        expect(response.body.description).toBe(movieData.description);
        expect(response.body.posterUrl).toBe(movieData.posterUrl);
        expect(response.body.duration).toBe(movieData.duration);

        createdSqlMovieId = response.body._id as number;
      });

      it('should return 400 when required fields are missing', async () => {
        const incompleteMovieData = {
          title: 'Incomplete Movie',
          duration: 100,
        };

        await request(app.getHttpServer())
          .post('/movies/sql')
          .send(incompleteMovieData)
          .expect(400);
      });
    });

    describe('GET /movies/sql', () => {
      it('should return 200 and all movies from SQL database', async () => {
        const response = await request(app.getHttpServer())
          .get('/movies/sql')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
          expect(response.body[0]).toHaveProperty('_id');
          expect(response.body[0]).toHaveProperty('title');
          expect(response.body[0]).toHaveProperty('description');
        }
      });
    });

    describe('GET /movies/sql/:id', () => {
      it('should return 200 and a movie by id from SQL database', async () => {
        if (!createdSqlMovieId) {
          const createResponse = await request(app.getHttpServer())
            .post('/movies/sql')
            .send(movieData);

          expect(createResponse.status).toBe(201);
          createdSqlMovieId = createResponse.body._id as number;
        }

        const response = await request(app.getHttpServer())
          .get(`/movies/sql/${createdSqlMovieId}`)
          .expect(200);

        expect(response.body).toHaveProperty('_id', createdSqlMovieId);
        expect(response.body).toHaveProperty('title');
        expect(response.body).toHaveProperty('description');
      });

      it('should return 404 for non-existent id', async () => {
        const fakeId = 99999;
        await request(app.getHttpServer())
          .get(`/movies/sql/${fakeId}`)
          .expect(404);
      });
    });
  });
});
