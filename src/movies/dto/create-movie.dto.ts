/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsUrl,
  Min,
  Max,
} from 'class-validator';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsNumber()
  @Min(1888, { message: 'Publish year must be at least 1888' })
  @Max(new Date().getFullYear() + 1, {
    message: 'Publish year cannot be in the future',
  })
  @IsNotEmpty({ message: 'Publish year is required' })
  publishYear: number;

  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  @IsNotEmpty({ message: 'Image URL is required' })
  imageURL: string;
}
