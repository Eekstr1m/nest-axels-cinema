import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Sessions } from './sessions.schema';
import mongoose, { Model } from 'mongoose';
import { Movie } from 'src/movies/movies.schema';
import { generateSessionTimes, generateSeats } from 'src/utils/utils';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Sessions.name) private sessionsModel: Model<Sessions>,
    @InjectModel(Movie.name) private movieModel: Model<Movie>,
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
}
