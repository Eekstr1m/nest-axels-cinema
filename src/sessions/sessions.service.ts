import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import mongoose, { Model } from 'mongoose';
import { Movies } from 'src/movies/entity/movie.entity';
import { Movie } from 'src/movies/schema/movies.schema';
import { generateSeats, generateSessionTimes } from 'src/utils/utils';
import { DataSource, Repository } from 'typeorm';
import { Session } from './entity/session.entity';
import { Seat } from './entity/seat.entity';
import { Sessions } from './schema/sessions.schema';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Sessions.name) private sessionsModel: Model<Sessions>,
    @InjectModel(Movie.name) private movieModel: Model<Movie>,

    @InjectRepository(Session) private sessionsRepository: Repository<Session>,
    @InjectRepository(Movies) private moviesRepository: Repository<Movies>,
    @InjectRepository(Seat) private seatsRepository: Repository<Seat>,
    private dataSource: DataSource,
  ) {}

  async findByMovieId(movieId: mongoose.Types.ObjectId) {
    const sessions = await this.sessionsModel
      .find({ movieId: movieId })
      .select('-seats -price');

    if (!sessions || sessions.length === 0) {
      throw new Error(`No sessions found for movie id ${movieId.toString()}`);
    }

    return sessions;
  }

  async findByMovieIdSql(movieId: number) {
    const sessions = await this.sessionsRepository.find({
      where: { movie: { _id: movieId } },
      select: ['_id', 'date', 'startTime'],
    });

    if (!sessions || sessions.length === 0) {
      throw new Error(`No sessions found for movie id ${movieId}`);
    }

    const formattedSessions = sessions.map((session) => ({
      _id: session._id,
      movieId: movieId,
      date: session.date,
      startTime: session.startTime,
    }));

    return formattedSessions;
  }

  async findSessionsByDateForMovie(
    movieId: mongoose.Types.ObjectId,
    date: string,
  ) {
    const sessions = await this.sessionsModel
      .find({
        movieId: movieId,
        date: date,
      })
      .select('-seats -price');

    if (!sessions || sessions.length === 0) {
      throw new Error(
        `No sessions found for movie id ${movieId.toString()} on date ${date}`,
      );
    }

    return sessions;
  }

  async findSessionsByDateForMovieSql(movieId: number, date: string) {
    const sessions = await this.sessionsRepository.find({
      where: { movie: { _id: movieId }, date: date },
      select: ['_id', 'date', 'startTime'],
    });

    if (!sessions || sessions.length === 0) {
      throw new Error(
        `No sessions found for movie id ${movieId} on date ${date}`,
      );
    }

    const formattedSessions = sessions.map((session) => ({
      _id: session._id,
      movieId: movieId,
      date: session.date,
      startTime: session.startTime,
    }));

    return formattedSessions;
  }

  async findSessionsDatesForMovie(movieId: mongoose.Types.ObjectId) {
    const sessions = await this.sessionsModel
      .find({ movieId })
      .select('date -_id');

    if (!sessions || sessions.length === 0) {
      throw new Error(
        `No session dates found for movie id ${movieId.toString()}`,
      );
    }

    const uniqueDates = Array.from(
      new Set(sessions.map((session) => session.date)),
    );

    return uniqueDates;
  }

  async findSessionsDatesForMovieSql(movieId: number) {
    const sessions = await this.sessionsRepository.find({
      where: { movie: { _id: movieId } },
      select: ['date'],
    });
    if (!sessions || sessions.length === 0) {
      throw new Error(`No session dates found for movie id ${movieId}`);
    }

    const uniqueDates = Array.from(
      new Set(sessions.map((session) => session.date)),
    );
    return uniqueDates;
  }

  async findSessionById(sessionId: mongoose.Types.ObjectId) {
    const session = await this.sessionsModel.findById(sessionId).populate({
      path: 'movieId',
      select: 'title',
    });

    if (!session) {
      throw new Error(`Session with id ${sessionId.toString()} not found`);
    }

    return session;
  }

  async findSessionByIdSql(sessionId: number) {
    const session = await this.sessionsRepository.findOne({
      where: { _id: sessionId },
      relations: ['movie', 'seats'],
    });

    if (!session) {
      throw new Error(`Session with id ${sessionId} not found`);
    }

    // Group seats by row
    const seatsByRow = new Map<number, any[]>();

    for (const seat of session.seats) {
      const rowNum = seat.rowNumber;
      if (!seatsByRow.has(rowNum)) {
        seatsByRow.set(rowNum, []);
      }
      seatsByRow.get(rowNum)?.push({
        row: seat.rowNumber,
        number: seat.seatNumber,
        isBooked: seat.isBooked,
      });
    }

    // Convert Map to sorted array
    const seatsGrouped: any[][] = [];
    const sortedEntries = Array.from(seatsByRow.entries()).sort(
      ([a], [b]) => a - b,
    );
    for (const [, rowSeats] of sortedEntries) {
      seatsGrouped.push(rowSeats);
    }

    const result = {
      _id: session._id,
      movieId: {
        _id: session.movie._id,
        title: session.movie.title,
      },
      date: session.date,
      startTime: session.startTime,
      price: session.price,
      seats: seatsGrouped,
    };

    return result;
  }

  async generateSessions() {
    const movies = await this.movieModel.find();
    const sessions: Partial<Sessions>[] = [];

    const today = new Date();
    const sessionTimes = generateSessionTimes();

    const PRICE = 10;

    for (const movie of movies) {
      for (let i = 0; i < 7; i++) {
        const sessionDate = new Date(today);
        sessionDate.setDate(today.getDate() + i);
        const formatDate = sessionDate.toISOString().split('T')[0];

        for (const time of sessionTimes) {
          sessions.push({
            movieId: movie._id,
            date: formatDate,
            startTime: time,
            seats: generateSeats(),
            price: PRICE,
          });
        }
      }
    }

    await this.sessionsModel.insertMany(sessions);
    return { message: 'Sessions generated successfully', sessions };
  }

  async generateSessionsSql() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const movies = await this.moviesRepository.find();

      if (!movies || movies.length === 0) {
        throw new Error('No movies found in database');
      }

      const today = new Date();
      const sessionTimes = generateSessionTimes();
      const PRICE = 10;

      let totalSessionsCreated = 0;
      let totalSeatsCreated = 0;

      for (const movie of movies) {
        for (let i = 0; i < 7; i++) {
          const sessionDate = new Date(today);
          sessionDate.setDate(today.getDate() + i);
          const formatDate = sessionDate.toISOString().split('T')[0];

          for (const time of sessionTimes) {
            const session = this.sessionsRepository.create({
              movie: movie,
              date: formatDate,
              startTime: time,
              price: PRICE,
            });

            const savedSession = await queryRunner.manager.save(session);
            totalSessionsCreated++;

            const seatRows = generateSeats();
            const seatsToInsert: Seat[] = [];

            for (const row of seatRows) {
              for (const seat of row) {
                const newSeat = this.seatsRepository.create({
                  session: savedSession,
                  rowNumber: seat.row,
                  seatNumber: seat.number,
                  isBooked: seat.isBooked || false,
                });
                seatsToInsert.push(newSeat);
              }
            }

            if (seatsToInsert.length > 0) {
              await queryRunner.manager.save(seatsToInsert);
              totalSeatsCreated += seatsToInsert.length;
            }
          }
        }
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Sessions generated successfully',
        sessionsCreated: totalSessionsCreated,
        seatsCreated: totalSeatsCreated,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error generating sessions:', error);
      throw new Error('Error generating sessions');
    } finally {
      await queryRunner.release();
    }
  }
}
