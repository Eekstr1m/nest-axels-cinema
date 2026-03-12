import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from '../booking.service';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../schema/booking.schema';
import {
  Sessions,
  SessionsDocument,
} from 'src/sessions/schema/sessions.schema';
import { DataSource } from 'typeorm';
import mongoose from 'mongoose';
import { Bookings } from '../entity/bookings.entity';
import {
  CreateBookingDto,
  CreateBookingSqlDto,
} from '../dto/create-booking.dto';
import { getModelToken } from '@nestjs/mongoose';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingSeat } from '../entity/bookings-seat.entity';
import { Seat } from 'src/sessions/entity/seat.entity';
import { Session } from 'src/sessions/entity/session.entity';

const mockSessionId = new mongoose.Types.ObjectId();
const mockMovieId = new mongoose.Types.ObjectId();

const mockSession = {
  _id: mockSessionId,
  movieId: mockMovieId,
  date: '2026-02-15',
  startTime: '18:00',
  price: 250,
  seats: [
    [
      { row: 1, number: 1, isBooked: false },
      { row: 1, number: 2, isBooked: false },
    ],
  ],
  save: jest.fn().mockResolvedValue(true),
} as unknown as SessionsDocument;

const mockBooking = {
  _id: new mongoose.Types.ObjectId(),
  sessionId: mockSessionId.toString(),
  movieId: mockMovieId.toString(),
  date: '2026-02-15',
  bookedSeats: [
    { row: 1, number: 1, isBooked: true },
    { row: 1, number: 2, isBooked: true },
  ],
  time: '18:00',
  pricePerSeat: 250,
  totalPrice: 500,
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '+380123456789',
  save: jest.fn().mockResolvedValue(true),
} as unknown as BookingDocument;

const mockBookingSql = {
  id: 1,
  session: { _id: 1 },
  movie: { _id: 1 },
  date: '2026-02-15',
  time: '18:00',
  pricePerSeat: 250,
  totalPrice: 500,
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '+380123456789',
  createdAt: new Date(),
  updatedAt: new Date(),
  bookingSeats: [],
} as unknown as Bookings;

const mockCreateBookingDto = {
  sessionId: mockSessionId,
  movieId: mockMovieId,
  date: '2026-02-15',
  bookedSeats: [
    { row: 1, number: 1, isBooked: true },
    { row: 1, number: 2, isBooked: true },
  ],
  time: '18:00',
  pricePerSeat: 250,
  totalPrice: 500,
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '+380123456789',
} as unknown as CreateBookingDto;

const mockCreateBookingSqlDto: CreateBookingSqlDto = {
  sessionId: 1,
  movieId: 1,
  date: '2026-02-15',
  bookedSeats: [
    { row: 1, number: 1 },
    { row: 1, number: 2 },
  ],
  time: '18:00',
  pricePerSeat: 250,
  totalPrice: 500,
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '+380123456789',
};

const mockSeat = {
  id: 1,
  session: { _id: 1 },
  rowNumber: 1,
  seatNumber: 1,
  isBooked: false,
  bookingSeats: [],
};

describe('BookingService', () => {
  let service: BookingService;
  let bookingModel: jest.Mocked<Model<Booking>>;
  let sessionsModel: jest.Mocked<Model<Sessions>>;
  let bookingRepository: {
    create: jest.Mock;
  };
  let bookingSeatRepository: {
    create: jest.Mock;
  };
  let seatRepository: {
    findOne: jest.Mock;
  };
  let sessionsRepository: {
    findOne: jest.Mock;
  };
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const mockBookingInstance = {
      _id: mockBooking._id,
      sessionId: mockBooking.sessionId,
      movieId: mockBooking.movieId,
      date: mockBooking.date,
      bookedSeats: mockBooking.bookedSeats,
      time: mockBooking.time,
      pricePerSeat: mockBooking.pricePerSeat,
      totalPrice: mockBooking.totalPrice,
      fullName: mockBooking.fullName,
      email: mockBooking.email,
      phone: mockBooking.phone,
      save: jest.fn().mockResolvedValue(mockBooking),
    };

    bookingModel = {
      constructor: jest.fn().mockReturnValue(mockBookingInstance),
    } as unknown as jest.Mocked<Model<Booking>>;

    sessionsModel = {
      findById: jest.fn().mockResolvedValue(mockSession),
    } as unknown as jest.Mocked<Model<Sessions>>;

    bookingRepository = {
      create: jest.fn().mockReturnValue(mockBookingSql),
    };

    bookingSeatRepository = {
      create: jest.fn().mockReturnValue({}),
    };

    seatRepository = {
      findOne: jest.fn().mockResolvedValue(mockSeat),
    };

    sessionsRepository = {
      findOne: jest.fn().mockResolvedValue({
        _id: mockCreateBookingSqlDto.sessionId,
        date: mockCreateBookingSqlDto.date,
        startTime: mockCreateBookingSqlDto.time,
        movie: { _id: mockCreateBookingSqlDto.movieId },
      }),
    };

    const mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn().mockResolvedValue(mockBookingSql),
      },
    };

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as unknown as jest.Mocked<DataSource>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getModelToken(Booking.name),
          useValue: bookingModel,
        },
        {
          provide: getModelToken(Sessions.name),
          useValue: sessionsModel,
        },
        {
          provide: getRepositoryToken(Bookings),
          useValue: bookingRepository,
        },
        {
          provide: getRepositoryToken(BookingSeat),
          useValue: bookingSeatRepository,
        },
        {
          provide: getRepositoryToken(Seat),
          useValue: seatRepository,
        },
        {
          provide: getRepositoryToken(Session),
          useValue: sessionsRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a booking successfully', async () => {
      const mockSave = jest.fn().mockResolvedValue(mockBooking);
      const mockBookingInstance = {
        ...mockBooking,
        save: mockSave,
      };
      const bookingModelConstructor = jest
        .fn()
        .mockReturnValue(mockBookingInstance);
      service['bookingModel'] =
        bookingModelConstructor as unknown as mongoose.Model<Booking>;

      const result = await service.create(mockCreateBookingDto);

      const { save: _save, ...expectedBooking } = mockBooking;
      const { save: _resultSave, ...actualResult } = result;

      expect(bookingModelConstructor).toHaveBeenCalledWith(
        mockCreateBookingDto,
      );
      expect(mockSave).toHaveBeenCalled();
      expect(actualResult).toEqual(expectedBooking);
    });

    it('should throw error when session not found', async () => {
      sessionsModel.findById.mockResolvedValue(null);

      await expect(service.create(mockCreateBookingDto)).rejects.toThrow(
        'Session not found',
      );
    });

    it('should throw error when seat is already booked', async () => {
      const sessionWithBookedSeats = {
        ...mockSession,
        seats: [
          [
            { row: 1, number: 1, isBooked: true },
            { row: 1, number: 2, isBooked: false },
          ],
        ],
        save: jest.fn().mockResolvedValue(true),
      };
      sessionsModel.findById.mockResolvedValue(sessionWithBookedSeats as any);

      await expect(service.create(mockCreateBookingDto)).rejects.toThrow(
        'Seat row 1, number 1 is already booked',
      );
    });

    it('should throw error when seat not found', async () => {
      const sessionWithDifferentSeats = {
        ...mockSession,
        seats: [
          [
            { row: 2, number: 1, isBooked: false },
            { row: 2, number: 2, isBooked: false },
          ],
        ],
        save: jest.fn().mockResolvedValue(true),
      };
      sessionsModel.findById.mockResolvedValue(
        sessionWithDifferentSeats as any,
      );

      await expect(service.create(mockCreateBookingDto)).rejects.toThrow(
        'Seat row 1, number 1 not found',
      );
    });

    it('should throw error when session movie does not match', async () => {
      const differentMovieId = new mongoose.Types.ObjectId();
      const sessionWithWrongMovie = {
        ...mockSession,
        movieId: differentMovieId,
        save: jest.fn().mockResolvedValue(true),
      };
      sessionsModel.findById.mockResolvedValue(sessionWithWrongMovie as any);

      await expect(service.create(mockCreateBookingDto)).rejects.toThrow(
        'Session movie does not match booking movie',
      );
    });

    it('should throw error when session date does not match', async () => {
      const sessionWithWrongDate = {
        ...mockSession,
        date: '2025-01-01',
        save: jest.fn().mockResolvedValue(true),
      };
      sessionsModel.findById.mockResolvedValue(sessionWithWrongDate as any);

      await expect(service.create(mockCreateBookingDto)).rejects.toThrow(
        'Session date does not match booking date',
      );
    });

    it('should throw error when session time does not match', async () => {
      const sessionWithWrongTime = {
        ...mockSession,
        startTime: '20:00',
        save: jest.fn().mockResolvedValue(true),
      };
      sessionsModel.findById.mockResolvedValue(sessionWithWrongTime as any);

      await expect(service.create(mockCreateBookingDto)).rejects.toThrow(
        'Session time does not match booking time',
      );
    });
  });

  describe('createSql', () => {
    it('should create a SQL booking successfully', async () => {
      seatRepository.findOne.mockImplementation(
        ({ where }: { where: { rowNumber: number; seatNumber: number } }) => {
          const seat = {
            id: where.rowNumber === 1 && where.seatNumber === 1 ? 1 : 2,
            session: { _id: 1 },
            rowNumber: where.rowNumber,
            seatNumber: where.seatNumber,
            isBooked: false,
            bookingSeats: [],
          };
          return Promise.resolve(seat);
        },
      );

      const result = await service.createSql(mockCreateBookingSqlDto);

      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(result).toEqual(mockBookingSql);
    });

    it('should throw error when seat not found in SQL', async () => {
      seatRepository.findOne.mockResolvedValue(null);

      await expect(service.createSql(mockCreateBookingSqlDto)).rejects.toThrow(
        'Seat row 1, number 1 not found',
      );
    });

    it('should throw error when seat is already booked in SQL', async () => {
      const bookedSeat = { ...mockSeat, isBooked: true };
      seatRepository.findOne.mockResolvedValue(bookedSeat);

      await expect(service.createSql(mockCreateBookingSqlDto)).rejects.toThrow(
        'Seat row 1, number 1 is already booked',
      );
    });

    it('should rollback transaction on error', async () => {
      bookingRepository.create.mockImplementation(() => {
        throw new Error('Database error');
      });

      const queryRunner = dataSource.createQueryRunner();

      await expect(service.createSql(mockCreateBookingSqlDto)).rejects.toThrow(
        'Database error',
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw error when session not found in SQL', async () => {
      sessionsRepository.findOne.mockResolvedValue(null);

      await expect(service.createSql(mockCreateBookingSqlDto)).rejects.toThrow(
        'Session not found',
      );
    });

    it('should throw error when session movie does not match in SQL', async () => {
      sessionsRepository.findOne.mockResolvedValue({
        _id: mockCreateBookingSqlDto.sessionId,
        date: mockCreateBookingSqlDto.date,
        startTime: mockCreateBookingSqlDto.time,
        movie: { _id: 999 },
      });

      await expect(service.createSql(mockCreateBookingSqlDto)).rejects.toThrow(
        'Session movie does not match booking movie',
      );
    });

    it('should throw error when session date does not match in SQL', async () => {
      sessionsRepository.findOne.mockResolvedValue({
        _id: mockCreateBookingSqlDto.sessionId,
        date: '2025-01-01',
        startTime: mockCreateBookingSqlDto.time,
        movie: { _id: mockCreateBookingSqlDto.movieId },
      });

      await expect(service.createSql(mockCreateBookingSqlDto)).rejects.toThrow(
        'Session date does not match booking date',
      );
    });

    it('should throw error when session time does not match in SQL', async () => {
      sessionsRepository.findOne.mockResolvedValue({
        _id: mockCreateBookingSqlDto.sessionId,
        date: mockCreateBookingSqlDto.date,
        startTime: '20:00',
        movie: { _id: mockCreateBookingSqlDto.movieId },
      });

      await expect(service.createSql(mockCreateBookingSqlDto)).rejects.toThrow(
        'Session time does not match booking time',
      );
    });
  });
});
