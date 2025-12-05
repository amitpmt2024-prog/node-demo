import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateMovieDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Title cannot be empty' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  title?: string;

  @IsOptional()
  @IsNumber()
  @Min(1888, { message: 'Publish year must be at least 1888' })
  @Max(new Date().getFullYear() + 1, {
    message: 'Publish year cannot be in the future',
  })
  publishYear?: number;

  @IsOptional()
  @IsString()
  imageURL?: string;
}
