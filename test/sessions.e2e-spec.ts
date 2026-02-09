import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionsModule } from 'src/sessions/sessions.module';
import { MoviesModule } from 'src/movies/movies.module';
import request from 'supertest';
import { App } from 'supertest/types';
import { getTestDatabaseModules } from './test-db.config';
import { DataSource } from 'typeorm';
import { getModelToken } from '@nestjs/mongoose';
import { Movie } from 'src/movies/schema/movies.schema';
import { Model } from 'mongoose';
import { Role } from 'src/auth/enums/role.enum';
import { User } from 'src/users/schema/user.schema';
import { UsersModule } from 'src/users/users.module';

const movieData = {
  title: 'Sessions Test Movie',
  description: 'A movie for sessions testing',
  posterUrl: 'https://example.com/sessions-poster.jpg',
  duration: 100,
  genres: ['Action'],
  releaseDate: '2026-01-01',
};

const adminUser = {
  email: 'movies.admin@example.com',
  password: 'Password123!',
  fullName: 'Movies Admin',
  phone: '+380123456789',
  role: Role.Admin,
};

describe('SessionsController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let movieModel: Model<Movie>;
  let userModel: Model<User>;
  let accessToken: string;
  let createdMovieId: string;
  let createdSqlMovieId: number;
  let createdSessionId: string;
  let createdSqlSessionId: number;
  let createdSessionDate: string;
  let createdSqlSessionDate: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        SessionsModule,
        MoviesModule,
        UsersModule,
        ...getTestDatabaseModules(),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    movieModel = moduleFixture.get<Model<Movie>>(getModelToken(Movie.name));
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));

    await userModel.deleteMany({});

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(adminUser)
      .expect(201);

    await userModel
      .findOneAndUpdate({ email: adminUser.email }, { role: Role.Admin })
      .exec();

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminUser.email, password: adminUser.password })
      .expect(201);

    accessToken = loginResponse.body.accessToken as string;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('MongoDB endpoints', () => {
    describe('GET /sessions/generate', () => {
      it('should return 404 when no movies exist', async () => {
        await movieModel.deleteMany({});

        const response = await request(app.getHttpServer())
          .get('/sessions/generate')
          .expect(404);

        expect(response.body).toHaveProperty('statusCode', 404);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('No movies found in database');
      });

      it('should return 200 and generate sessions for existing movies', async () => {
        if (!createdMovieId) {
          const createMovieResponse = await request(app.getHttpServer())
            .post('/movies')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(movieData)
            .expect(201);

          createdMovieId = createMovieResponse.body._id as string;
        }

        const response = await request(app.getHttpServer())
          .get('/sessions/generate')
          .expect(200);

        expect(response.body).toHaveProperty(
          'message',
          'Sessions generated successfully',
        );
        expect(response.body).toHaveProperty('sessionsCreated');
        expect(response.body).toHaveProperty('seatsCreated');
      });
    });

    describe('GET /sessions/movie/:movieId', () => {
      it('should return 200 and sessions by movie id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/sessions/movie/${createdMovieId}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('_id');
        expect(response.body[0]).toHaveProperty('movieId', createdMovieId);
        expect(response.body[0]).toHaveProperty('date');
        expect(response.body[0]).toHaveProperty('startTime');

        createdSessionId = response.body[0]._id as string;
        createdSessionDate = response.body[0].date as string;
      });

      it('should return 404 for non-existing movie id', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        await request(app.getHttpServer())
          .get(`/sessions/movie/${fakeId}`)
          .expect(404);
      });

      it('should return 400 for invalid movie id format', async () => {
        const invalidId = 'invalid-id';
        const response = await request(app.getHttpServer())
          .get(`/sessions/movie/${invalidId}`)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain(
          `Invalid ObjectId: '${invalidId}' is not a valid MongoDB ObjectId`,
        );
      });
    });

    describe('GET /sessions/movie/:movieId/date/:date', () => {
      it('should return 200 and sessions by movie id and date', async () => {
        const response = await request(app.getHttpServer())
          .get(`/sessions/movie/${createdMovieId}/date/${createdSessionDate}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('_id');
        expect(response.body[0]).toHaveProperty('movieId', createdMovieId);
        expect(response.body[0]).toHaveProperty('date', createdSessionDate);
        expect(response.body[0]).toHaveProperty('startTime');
      });

      it('should return 404 for non-existing movie id and date', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        await request(app.getHttpServer())
          .get(`/sessions/movie/${fakeId}/date/2024-12-31`)
          .expect(404);
      });

      it('should return 400 for invalid movie id format', async () => {
        const invalidId = 'invalid-id';
        const response = await request(app.getHttpServer())
          .get(`/sessions/movie/${invalidId}/date/12`)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain(
          `Invalid ObjectId: '${invalidId}' is not a valid MongoDB ObjectId`,
        );
      });
    });

    describe('GET /sessions/movie/:movieId/dates', () => {
      it('should return 200 and unique session dates for movie id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/sessions/movie/${createdMovieId}/dates`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body).toContain(createdSessionDate);
      });

      it('should return 404 for non-existing movie id', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        await request(app.getHttpServer())
          .get(`/sessions/movie/${fakeId}/dates`)
          .expect(404);
      });

      it('should return 400 for invalid movie id format', async () => {
        const invalidId = 'invalid-id';
        const response = await request(app.getHttpServer())
          .get(`/sessions/movie/${invalidId}/dates`)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain(
          `Invalid ObjectId: '${invalidId}' is not a valid MongoDB ObjectId`,
        );
      });
    });

    describe('GET /sessions/:sessionId', () => {
      it('should return 200 and session by id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/sessions/${createdSessionId}`)
          .expect(200);

        expect(response.body).toHaveProperty('_id', createdSessionId);
        expect(response.body).toHaveProperty('movieId', {
          _id: createdMovieId,
          title: movieData.title,
        });
        expect(response.body).toHaveProperty('date', createdSessionDate);
        expect(response.body).toHaveProperty('startTime');
      });

      it('should return 404 for non-existing session id', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        await request(app.getHttpServer())
          .get(`/sessions/${fakeId}`)
          .expect(404);
      });

      it('should return 400 for invalid session id format', async () => {
        const invalidId = 'invalid-id';
        const response = await request(app.getHttpServer())
          .get(`/sessions/${invalidId}`)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain(
          `Invalid ObjectId: '${invalidId}' is not a valid MongoDB ObjectId`,
        );
      });
    });
  });

  describe('SQL endpoints', () => {
    describe('GET /sessions/sql/generate', () => {
      it('should return 404 when no movies exist', async () => {
        await dataSource.query('DELETE FROM movies');

        const response = await request(app.getHttpServer())
          .get('/sessions/sql/generate')
          .expect(404);

        expect(response.body).toHaveProperty('statusCode', 404);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('No movies found in database');
      });

      it('should return 200 and generate sessions for SQL existing movies', async () => {
        if (!createdSqlMovieId) {
          const createMovieResponse = await request(app.getHttpServer())
            .post('/movies/sql')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(movieData)
            .expect(201);

          createdSqlMovieId = createMovieResponse.body._id as number;
        }

        const response = await request(app.getHttpServer())
          .get('/sessions/sql/generate')
          .expect(200);

        expect(response.body).toHaveProperty(
          'message',
          'Sessions generated successfully',
        );
        expect(response.body).toHaveProperty('sessionsCreated');
        expect(response.body).toHaveProperty('seatsCreated');

        // Long time operation needs more time
      }, 60000);
    });

    describe('GET /sessions/sql/movie/:movieId', () => {
      it('should return 200 and sessions by SQL movie id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/sessions/sql/movie/${createdSqlMovieId}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('_id');
        expect(response.body[0]).toHaveProperty(
          'movieId',
          createdSqlMovieId.toString(),
        );
        expect(response.body[0]).toHaveProperty('date');
        expect(response.body[0]).toHaveProperty('startTime');

        createdSqlSessionId = response.body[0]._id as number;
        createdSqlSessionDate = response.body[0].date as string;
      });

      it('should return 404 for non-existing SQL movie id', async () => {
        await request(app.getHttpServer())
          .get(`/sessions/sql/movie/99999`)
          .expect(404);
      });
    });

    describe('GET /sessions/sql/movie/:movieId/date/:date', () => {
      it('should return 200 and sessions by SQL movie id and date', async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/sessions/sql/movie/${createdSqlMovieId}/date/${createdSqlSessionDate}`,
          )
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('_id');
        expect(response.body[0]).toHaveProperty(
          'movieId',
          createdSqlMovieId.toString(),
        );
        expect(response.body[0]).toHaveProperty('date', createdSqlSessionDate);
        expect(response.body[0]).toHaveProperty('startTime');
      });

      it('should return 404 for non-existing SQL movie id and date', async () => {
        await request(app.getHttpServer())
          .get(`/sessions/sql/movie/99999/date/2024-12-31`)
          .expect(404);
      });
    });

    describe('GET /sessions/sql/movie/:movieId/dates', () => {
      it('should return 200 and unique session dates for SQL movie id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/sessions/sql/movie/${createdSqlMovieId}/dates`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body).toContain(createdSqlSessionDate);
      });

      it('should return 404 for non-existing SQL movie id', async () => {
        await request(app.getHttpServer())
          .get(`/sessions/sql/movie/99999/dates`)
          .expect(404);
      });
    });

    describe('GET /sessions/sql/:sessionId', () => {
      it('should return 200 and session by SQL id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/sessions/sql/${createdSqlSessionId}`)
          .expect(200);

        expect(response.body).toHaveProperty('_id', createdSqlSessionId);
        expect(response.body).toHaveProperty('movieId', {
          _id: createdSqlMovieId,
          title: movieData.title,
        });
        expect(response.body).toHaveProperty('date', createdSqlSessionDate);
        expect(response.body).toHaveProperty('startTime');
        expect(response.body).toHaveProperty('seats');
      });

      it('should return 404 for non-existing SQL session id', async () => {
        await request(app.getHttpServer())
          .get(`/sessions/sql/99999`)
          .expect(404);
      });
    });
  });
});
