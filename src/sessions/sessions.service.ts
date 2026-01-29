import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Sessions } from './sessions.schema';
import { Model } from 'mongoose';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Sessions.name) private sessionsModel: Model<Sessions>,
  ) {}

  async findByMovieId(movieId: string) {
    const sessions = await this.sessionsModel
      .find({ movieId: movieId })
      .select('-seats -price');

    if (!sessions || sessions.length === 0) {
      throw new Error(`No sessions found for movie id ${movieId}`);
    }

    return sessions;
  }

  async findSessionsByDateForMovie(movieId: string, date: string) {
    const sessions = await this.sessionsModel
      .find({
        movieId: movieId,
        date: date,
      })
      .select('-seats -price');

    if (!sessions || sessions.length === 0) {
      throw new Error(
        `No sessions found for movie id ${movieId} on date ${date}`,
      );
    }

    return sessions;
  }

  async findSessionsDatesForMovie(movieId: string) {
    const sessions = await this.sessionsModel
      .find({ movieId })
      .select('date -_id');

    if (!sessions || sessions.length === 0) {
      throw new Error(`No session dates found for movie id ${movieId}`);
    }

    const uniqueDates = Array.from(
      new Set(sessions.map((session) => session.date)),
    );

    return uniqueDates;
  }

  async findSessionById(sessionId: string) {
    const session = await this.sessionsModel.findById(sessionId).populate({
      path: 'movieId',
      select: 'title',
    });

    if (!session) {
      throw new Error(`Session with id ${sessionId} not found`);
    }

    return session;
  }
}
