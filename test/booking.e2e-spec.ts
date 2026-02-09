import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingModule } from 'src/booking/booking.module';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { getTestDatabaseModules } from './test-db.config';
import { Model } from 'mongoose';
import { Booking } from 'src/booking/schema/booking.schema';
import { getModelToken } from '@nestjs/mongoose';
import request from 'supertest';
import { SessionsModule } from 'src/sessions/sessions.module';
import { MoviesModule } from 'src/movies/movies.module';
import { Sessions } from 'src/sessions/schema/sessions.schema';
import { Movie } from 'src/movies/schema/movies.schema';
import { User } from 'src/users/schema/user.schema';
import { UsersModule } from 'src/users/users.module';
import { Role } from 'src/auth/enums/role.enum';

describe('BookingController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let bookingModel: Model<Booking>;
  let sessionsModel: Model<Sessions>;
  let movieModel: Model<Movie>;
  let userModel: Model<User>;
  let accessToken: string;
  let createdMovieId: string;
  let createdSessionId: string;
  let createdSessionDate: string;
  let createdSessionTime: string;
  let createdSqlMovieId: number;
  let createdSqlSessionId: number;
  let createdSqlSessionDate: string;
  let createdSqlSessionTime: string;

  const movieData = {
    title: 'Booking Test Movie',
    description: 'A movie for booking testing',
    posterUrl: 'https://example.com/booking-poster.jpg',
    duration: 110,
    genres: ['Action'],
    releaseDate: '2026-01-01',
  };

  const staleBookingData = {
    bookedSeats: [{ row: 1, number: 1, isBooked: true }],
    pricePerSeat: 10,
    totalPrice: 10,
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
  };

  const adminUser = {
    email: 'movies.admin@example.com',
    password: 'Password123!',
    fullName: 'Movies Admin',
    phone: '+380123456789',
    role: Role.Admin,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        BookingModule,
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
    bookingModel = moduleFixture.get<Model<Booking>>(
      getModelToken(Booking.name),
    );
    sessionsModel = moduleFixture.get<Model<Sessions>>(
      getModelToken(Sessions.name),
    );
    movieModel = moduleFixture.get<Model<Movie>>(getModelToken(Movie.name));
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));

    await bookingModel.deleteMany({});
    await sessionsModel.deleteMany({});
    await movieModel.deleteMany({});
    await userModel.deleteMany({});

    await dataSource.query('DELETE FROM booking_seat');
    await dataSource.query('DELETE FROM bookings');
    await dataSource.query('DELETE FROM seat');
    await dataSource.query('DELETE FROM session');
    await dataSource.query('DELETE FROM movies');

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
    describe('POST /movies', () => {
      it('should return 201 and create a new booking', async () => {
        if (!createdMovieId) {
          const createdMovieResponse = await request(app.getHttpServer())
            .post('/movies')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(movieData)
            .expect(201);

          createdMovieId = createdMovieResponse.body._id as string;
        }

        await request(app.getHttpServer())
          .get('/sessions/generate')
          .expect(200);

        const sessionsResponse = await request(app.getHttpServer())
          .get(`/sessions/movie/${createdMovieId}`)
          .expect(200);

        createdSessionId = sessionsResponse.body[0]._id as string;
        createdSessionDate = sessionsResponse.body[0].date as string;
        createdSessionTime = sessionsResponse.body[0].startTime as string;

        const bookingData = {
          sessionId: createdSessionId,
          movieId: createdMovieId,
          date: createdSessionDate,
          time: createdSessionTime,
          ...staleBookingData,
        };

        const response = await request(app.getHttpServer())
          .post('/booking')
          .send(bookingData)
          .expect(201);

        expect(response.body).toHaveProperty('_id');
        expect(response.body.sessionId).toBe(bookingData.sessionId);
        expect(response.body.movieId).toBe(bookingData.movieId);
        expect(response.body.date).toBe(bookingData.date);
        expect(response.body.time).toBe(bookingData.time);
        expect(response.body.pricePerSeat).toBe(bookingData.pricePerSeat);
        expect(response.body.totalPrice).toBe(bookingData.totalPrice);
        expect(response.body.fullName).toBe(bookingData.fullName);
        expect(response.body.email).toBe(bookingData.email);
        expect(response.body.phone).toBe(bookingData.phone);
      });

      it('should return 400 with invalid data', async () => {
        const invalidBookingData = {
          sessionId: 'invalid-id',
          movieId: 'invalid-id',
          date: 'invalid-date',
        };

        const response = await request(app.getHttpServer())
          .post('/booking')
          .send(invalidBookingData)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain(
          'sessionId must be a mongodb id',
        );
        expect(response.body.message).toContain('movieId must be a mongodb id');
        expect(response.body.message).toContain(
          'date must be a valid ISO 8601 date string',
        );
      });

      it('should return 400 when session does not exist', async () => {
        const nonExistentSessionId = '507f1f77bcf86cd799439011';
        const invalidBookingData = {
          sessionId: nonExistentSessionId,
          movieId: createdMovieId,
          date: createdSessionDate,
          time: createdSessionTime,
          ...staleBookingData,
        };

        const response = await request(app.getHttpServer())
          .post('/booking')
          .send(invalidBookingData)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty('message', 'Session not found');
      });

      it('should return 400 when movie does not exist', async () => {
        const nonExistentMovieId = '507f1f77bcf86cd799439011';
        const invalidBookingData = {
          sessionId: createdSessionId,
          movieId: nonExistentMovieId,
          date: createdSessionDate,
          time: createdSessionTime,
          ...staleBookingData,
        };

        const response = await request(app.getHttpServer())
          .post('/booking')
          .send(invalidBookingData)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty(
          'message',
          'Session movie does not match booking movie',
        );
      });

      it('should return 400 when date does not match booking date', async () => {
        const invalidBookingData = {
          sessionId: createdSessionId,
          movieId: createdMovieId,
          date: '2025-12-31',
          time: createdSessionTime,
          ...staleBookingData,
        };

        const response = await request(app.getHttpServer())
          .post('/booking')
          .send(invalidBookingData)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty(
          'message',
          'Session date does not match booking date',
        );
      });

      it('should return 400 when time does not match booking time', async () => {
        const invalidBookingData = {
          sessionId: createdSessionId,
          movieId: createdMovieId,
          date: createdSessionDate,
          time: '23:59',
          ...staleBookingData,
        };

        const response = await request(app.getHttpServer())
          .post('/booking')
          .send(invalidBookingData)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty(
          'message',
          'Session time does not match booking time',
        );
      });

      it('should return 400 when data is missing', async () => {
        const incompleteBookingData = {
          sessionId: createdSessionId,
          movieId: createdMovieId,
        };

        const response = await request(app.getHttpServer())
          .post('/booking')
          .send(incompleteBookingData)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body.message.length).toBeGreaterThan(0);
        expect(
          response.body.message.some((msg: string) =>
            /should not be empty/.test(msg),
          ),
        ).toBe(true);
      });
    });
  });

  describe('SQL endpoints', () => {
    describe('POST /booking/sql', () => {
      it('should return 201 and create a new booking', async () => {
        if (!createdSqlMovieId) {
          const createMovieResponse = await request(app.getHttpServer())
            .post('/movies/sql')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(movieData)
            .expect(201);

          createdSqlMovieId = createMovieResponse.body._id as number;
        }

        await request(app.getHttpServer())
          .get('/sessions/sql/generate')
          .expect(200);

        const sessionsResponse = await request(app.getHttpServer())
          .get(`/sessions/sql/movie/${createdSqlMovieId}`)
          .expect(200);

        createdSqlSessionId = sessionsResponse.body[0]._id as number;
        createdSqlSessionDate = sessionsResponse.body[0].date as string;
        createdSqlSessionTime = sessionsResponse.body[0].startTime as string;

        const bookingData = {
          sessionId: createdSqlSessionId,
          movieId: createdSqlMovieId,
          date: createdSqlSessionDate,
          time: createdSqlSessionTime,
          ...staleBookingData,
        };

        const response = await request(app.getHttpServer())
          .post('/booking/sql')
          .send(bookingData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.session._id).toBe(bookingData.sessionId);
        expect(response.body.movie._id).toBe(bookingData.movieId);
        expect(response.body.date).toBe(bookingData.date);
        expect(response.body.time).toBe(bookingData.time);
        expect(response.body.pricePerSeat).toBe(bookingData.pricePerSeat);
        expect(response.body.totalPrice).toBe(bookingData.totalPrice);
        expect(response.body.fullName).toBe(bookingData.fullName);
        expect(response.body.email).toBe(bookingData.email);
        expect(response.body.phone).toBe(bookingData.phone);

        // Long time operation needs more time
      }, 60000);

      it('should return 400 with invalid data', async () => {
        const invalidBookingData = {
          sessionId: 'invalid-id',
          movieId: 'invalid-id',
          date: 'invalid-date',
        };

        const response = await request(app.getHttpServer())
          .post('/booking/sql')
          .send(invalidBookingData)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain(
          'sessionId must be a number conforming to the specified constraints',
        );
        expect(response.body.message).toContain(
          'movieId must be a number conforming to the specified constraints',
        );
        expect(response.body.message).toContain(
          'date must be a valid ISO 8601 date string',
        );
      });

      it('should return 400 when session does not exist', async () => {
        const nonExistentSessionId = 999999;
        const invalidBookingData = {
          sessionId: nonExistentSessionId,
          movieId: createdSqlMovieId,
          date: createdSqlSessionDate,
          time: createdSqlSessionTime,
          ...staleBookingData,
        };

        const response = await request(app.getHttpServer())
          .post('/booking/sql')
          .send(invalidBookingData)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty('message', 'Session not found');
      });

      it('should return 400 when movie does not exist', async () => {
        const nonExistentMovieId = 999999;
        const invalidBookingData = {
          sessionId: createdSqlSessionId,
          movieId: nonExistentMovieId,
          date: createdSqlSessionDate,
          time: createdSqlSessionTime,
          ...staleBookingData,
        };

        const response = await request(app.getHttpServer())
          .post('/booking/sql')
          .send(invalidBookingData)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty(
          'message',
          'Session movie does not match booking movie',
        );
      });

      it('should return 400 when date does not match booking date', async () => {
        const invalidBookingData = {
          sessionId: createdSqlSessionId,
          movieId: createdSqlMovieId,
          date: '2025-12-31',
          time: createdSqlSessionTime,
          ...staleBookingData,
        };

        const response = await request(app.getHttpServer())
          .post('/booking/sql')
          .send(invalidBookingData)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty(
          'message',
          'Session date does not match booking date',
        );
      });

      it('should return 400 when time does not match booking time', async () => {
        const invalidBookingData = {
          sessionId: createdSqlSessionId,
          movieId: createdSqlMovieId,
          date: createdSqlSessionDate,
          time: '23:59',
          ...staleBookingData,
        };

        const response = await request(app.getHttpServer())
          .post('/booking/sql')
          .send(invalidBookingData)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty(
          'message',
          'Session time does not match booking time',
        );
      });

      it('should return 400 when data is missing', async () => {
        const incompleteBookingData = {
          sessionId: createdSqlSessionId,
          movieId: createdSqlMovieId,
        };
        const response = await request(app.getHttpServer())
          .post('/booking/sql')
          .send(incompleteBookingData)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body.message.length).toBeGreaterThan(0);
        expect(
          response.body.message.some((msg: string) =>
            /should not be empty/.test(msg),
          ),
        ).toBe(true);
      });
    });
  });
});
