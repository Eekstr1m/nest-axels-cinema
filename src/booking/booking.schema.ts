import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Seat, SeatSchema } from 'src/sessions/sessions.schema';

export type BookingDocument = HydratedDocument<Booking>;

@Schema({ timestamps: true })
export class Booking {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  })
  sessionId: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true,
  })
  movieId: string;

  @Prop({ required: true })
  date: string;

  @Prop({ type: [[SeatSchema]], required: true })
  bookedSeats: Seat[][];

  @Prop({ required: true })
  time: string;

  @Prop({ required: true })
  pricePerSeat: number;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
