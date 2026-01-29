import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  posterUrl: string;

  @IsNotEmpty()
  @IsInt()
  duration: number;

  @IsArray()
  @IsNotEmpty()
  @ArrayNotEmpty()
  @IsString({ each: true })
  genres: string[];

  @IsNotEmpty()
  releaseDate: Date;
}
