import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MovieDocument = HydratedDocument<Movie>;

@Schema({ timestamps: true })
export class Movie {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  posterUrl: string;

  @Prop({ required: true })
  duration: number;

  @Prop({ required: true, type: [String] })
  genres: string[];

  @Prop({ required: true })
  releaseDate: Date;
}

export const MoviesSchema = SchemaFactory.createForClass(Movie);
