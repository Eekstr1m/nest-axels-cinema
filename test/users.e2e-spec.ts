import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { getTestDatabaseModules } from './test-db.config';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/schema/user.schema';
import { Booking } from 'src/booking/schema/booking.schema';

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  let userModel: Model<User>;
  let bookingModel: Model<Booking>;
  let accessToken: string;
  let createdUserId: string;

  const baseUser = {
    email: 'users.e2e@example.com',
    password: 'Password123!',
    fullName: 'Users E2E User',
    phone: '+380500000002',
  };

  const secondaryUser = {
    email: 'users.e2e.secondary@example.com',
    password: 'Password123!',
    fullName: 'Users E2E Secondary',
    phone: '+380500000003',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [...getTestDatabaseModules(), UsersModule, AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    bookingModel = moduleFixture.get<Model<Booking>>(
      getModelToken(Booking.name),
    );

    await bookingModel.deleteMany({});
    await userModel.deleteMany({});

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(baseUser)
      .expect(201);

    accessToken = registerResponse.body.accessToken as string;
    createdUserId = registerResponse.body.id as string;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('MongoDB endpoints', () => {
    describe('GET /users/profile', () => {
      it('should return 200 and user profile', async () => {
        const response = await request(app.getHttpServer())
          .get('/users/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('_id', createdUserId);
        expect(response.body).toHaveProperty('fullName', baseUser.fullName);
        expect(response.body).toHaveProperty('email', baseUser.email);
        expect(response.body).toHaveProperty('phone', baseUser.phone);
      });

      it('should return 401 when access token is missing', async () => {
        await request(app.getHttpServer()).get('/users/profile').expect(401);
      });
    });

    describe('GET /users/auth-user', () => {
      it('should return 200 and detailed user info', async () => {
        const response = await request(app.getHttpServer())
          .get('/users/auth-user')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('userId', createdUserId);
        expect(response.body).toHaveProperty('fullName', baseUser.fullName);
        expect(response.body).toHaveProperty('email', baseUser.email);
        expect(response.body).toHaveProperty('phone', baseUser.phone);
        expect(response.body).toHaveProperty('totalMoviesBooked', 0);
        expect(response.body).toHaveProperty('totalSeatsBooked', 0);
        expect(response.body).toHaveProperty('totalMoneySpent', 0);
      });

      it('should return 401 when access token is missing', async () => {
        await request(app.getHttpServer()).get('/users/auth-user').expect(401);
      });
    });

    describe('POST /users/create', () => {
      it('should return 201 and create a new user', async () => {
        const response = await request(app.getHttpServer())
          .post('/users/create')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(secondaryUser)
          .expect(201);

        expect(response.body).toHaveProperty('_id');
        expect(response.body).toHaveProperty(
          'fullName',
          secondaryUser.fullName,
        );
        expect(response.body).toHaveProperty('email', secondaryUser.email);
        expect(response.body).toHaveProperty('role');
      });

      it('should return 400 when required fields are missing', async () => {
        await request(app.getHttpServer())
          .post('/users/create')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ email: 'missing@example.com' })
          .expect(400);
      });

      it('should return 404 when user with email already exists', async () => {
        const response = await request(app.getHttpServer())
          .post('/users/create')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(secondaryUser)
          .expect(404);

        expect(response.body).toHaveProperty('statusCode', 404);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 401 when access token is missing', async () => {
        await request(app.getHttpServer())
          .post('/users/create')
          .send(secondaryUser)
          .expect(401);
      });
    });
  });
});
