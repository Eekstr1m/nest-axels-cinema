import { SeatDocument } from 'src/sessions/sessions.schema';

export class CreateBookingDto {
  sessionId: string;
  movieId: string;
  date: string;
  bookedSeats: SeatDocument[][];
  time: string;
  pricePerSeat: number;
  totalPrice: number;
  fullName: string;
  email: string;
  phone: string;
}
