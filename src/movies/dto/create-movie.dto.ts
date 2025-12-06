import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(1, { message: 'Title cannot be empty' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  title: string;

  @IsNumber()
  @Min(1888, { message: 'Publish year must be at least 1888' })
  @Max(new Date().getFullYear() + 1, {
    message: 'Publish year cannot be in the future',
  })
  @IsNotEmpty({ message: 'Publish year is required' })
  publishYear: number;

  @IsString()
  @IsNotEmpty({ message: 'Image URL is required' })
  imageURL: string;
}
