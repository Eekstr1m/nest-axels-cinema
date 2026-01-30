import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type SeatDocument = HydratedDocument<Seat>;
export type SessionsDocument = HydratedDocument<Sessions>;

@Schema({ _id: false })
export class Seat {
  @Prop({ required: true })
  row: number;

  @Prop({ required: true })
  number: number;

  @Prop({ default: false })
  isBooked: boolean;
}

export const SeatSchema = SchemaFactory.createForClass(Seat);

// Session schema
@Schema()
export class Sessions {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true })
  movieId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ type: [[SeatSchema]], required: true })
  seats: Seat[][];

  @Prop({ required: true })
  price: number;
}

export const SessionsSchema = SchemaFactory.createForClass(Sessions);
