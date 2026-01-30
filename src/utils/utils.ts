import { Seat } from 'src/sessions/sessions.schema';

export const generateSessionTimes = () => {
  const times: string[] = [];
  for (let hour = 10; hour <= 20; hour += 2) {
    times.push(`${hour}:00`);
  }
  return times;
};

export const generateSeats = (rows: number = 10, seatsPerRow: number = 10) => {
  const seats: Seat[][] = [];
  for (let row = 1; row <= rows; row++) {
    const rowSeats: Seat[] = [];
    for (let number = 1; number <= seatsPerRow; number++) {
      rowSeats.push({
        row,
        number,
        isBooked: false,
      });
    }
    seats.push(rowSeats);
  }
  return seats;
};
