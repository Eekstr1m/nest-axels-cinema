import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { getTestDatabaseModules } from './test-db.config';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/schema/user.schema';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let userModel: Model<User>;
  let createdUserId: string;
  let accessToken: string;
  let refreshCookie: string;

  const registerData = {
    email: 'auth.e2e@example.com',
    password: 'Password123!',
    fullName: 'Auth E2E User',
    phone: '+380500000001',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, UsersModule, ...getTestDatabaseModules()],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    await userModel.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  describe('MongoDB endpoints', () => {
    describe('POST /auth/register', () => {
      it('should return 201 and register a new user', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(registerData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('accessToken');
        expect(Array.isArray(response.headers['set-cookie'])).toBe(true);

        createdUserId = response.body.id as string;
        accessToken = response.body.accessToken as string;
        refreshCookie = response.headers['set-cookie'][0];
      });

      it('should return 400 when required fields are missing', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({ email: registerData.email })
          .expect(400);
      });
    });

    describe('POST /auth/login', () => {
      it('should return 201 and login with valid credentials', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: registerData.email,
            password: registerData.password,
          })
          .expect(201);

        expect(response.body).toHaveProperty('id', createdUserId);
        expect(response.body).toHaveProperty('accessToken');
        expect(Array.isArray(response.headers['set-cookie'])).toBe(true);

        accessToken = response.body.accessToken as string;
        refreshCookie = response.headers['set-cookie'][0];
      });

      it('should return 400 with invalid credentials', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: registerData.email,
            password: 'WrongPassword!',
          })
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('POST /auth/refresh', () => {
      it('should return 201 and refresh tokens with valid cookie', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', refreshCookie)
          .expect(201);

        expect(response.body).toHaveProperty('id', createdUserId);
        expect(response.body).toHaveProperty('accessToken');
        expect(Array.isArray(response.headers['set-cookie'])).toBe(true);
      });

      it('should return 401 when refresh cookie is missing', async () => {
        await request(app.getHttpServer()).post('/auth/refresh').expect(401);
      });
    });

    describe('POST /auth/logout', () => {
      it('should return 201 and logout with valid access token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(201);

        expect(response.body).toHaveProperty(
          'message',
          'Logged out successfully',
        );
      });

      it('should return 401 when access token is missing', async () => {
        await request(app.getHttpServer()).post('/auth/logout').expect(401);
      });
    });
  });
});
