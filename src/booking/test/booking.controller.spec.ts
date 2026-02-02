import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from '../booking.controller';
import { BookingService } from '../booking.service';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import mongoose from 'mongoose';
import {
  CreateBookingDto,
  CreateBookingSqlDto,
} from '../dto/create-booking.dto';
import { BookingDocument } from '../schema/booking.schema';
import { Bookings } from '../entity/bookings.entity';

const mockBookingMongo = {
  _id: new mongoose.Types.ObjectId(),
  sessionId: new mongoose.Types.ObjectId().toString(),
  movieId: new mongoose.Types.ObjectId().toString(),
  date: '2026-02-15',
  bookedSeats: [
    [
      { row: 1, number: 1, isBooked: true },
      { row: 1, number: 2, isBooked: true },
    ],
  ],
  time: '19:00',
  pricePerSeat: 250,
  totalPrice: 500,
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '+380123456789',
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as BookingDocument;

const mockBookingSql = {
  id: 1,
  session: null,
  movie: null,
  date: '2026-02-15',
  time: '19:00',
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
  sessionId: new mongoose.Types.ObjectId(),
  movieId: new mongoose.Types.ObjectId(),
  date: '2026-02-15',
  bookedSeats: [
    [
      { row: 1, number: 1, isBooked: true },
      { row: 1, number: 2, isBooked: true },
    ],
  ],
  time: '19:00',
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
  time: '19:00',
  pricePerSeat: 250,
  totalPrice: 500,
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '+380123456789',
};

describe('BookingController', () => {
  let controller: BookingController;
  let service: BookingService;

  const mockBookingService = {
    create: jest.fn().mockResolvedValue(mockBookingMongo),
    createSql: jest.fn().mockResolvedValue(mockBookingSql),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
    service = module.get<BookingService>(BookingService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a booking', async () => {
      const result = await controller.create(mockCreateBookingDto);

      expect(result).toEqual(mockBookingMongo);
      expect(service.create).toHaveBeenCalledWith(mockCreateBookingDto);
    });

    it('should throw BadRequestException on error', async () => {
      mockBookingService.create.mockRejectedValue(new Error('Booking failed'));

      await expect(controller.create(mockCreateBookingDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(mockCreateBookingDto)).rejects.toThrow(
        'Booking failed',
      );
    });

    it('should throw BadRequestException with default message on unknown error', async () => {
      mockBookingService.create.mockRejectedValue('Unknown error');

      await expect(controller.create(mockCreateBookingDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(mockCreateBookingDto)).rejects.toThrow(
        'Booking not created',
      );
    });
  });

  describe('createSql', () => {
    it('should create a booking in SQL', async () => {
      const result = await controller.createSql(mockCreateBookingSqlDto);

      expect(result).toEqual(mockBookingSql);
      expect(service.createSql).toHaveBeenCalledWith(mockCreateBookingSqlDto);
    });

    it('should throw BadRequestException on error', async () => {
      mockBookingService.createSql.mockRejectedValue(
        new Error('SQL booking failed'),
      );

      await expect(
        controller.createSql(mockCreateBookingSqlDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.createSql(mockCreateBookingSqlDto),
      ).rejects.toThrow('SQL booking failed');
    });

    it('should throw InternalServerErrorException on unknown error', async () => {
      mockBookingService.createSql.mockRejectedValue('Unknown error');

      await expect(
        controller.createSql(mockCreateBookingSqlDto),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        controller.createSql(mockCreateBookingSqlDto),
      ).rejects.toThrow('Booking not created');
    });
  });
});
