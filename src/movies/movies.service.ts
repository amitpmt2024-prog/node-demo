import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Movie, MovieDocument } from './schemas/movie.schema';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { QueryMovieDto } from './dto/query-movie.dto';

@Injectable()
export class MoviesService {
  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
  ) {}

  async create(
    createMovieDto: CreateMovieDto,
  ): Promise<{ movie: Movie; message: string }> {
    // Check if movie with same title and year already exists
    const existingMovie = await this.movieModel.findOne({
      title: createMovieDto.title,
      publishYear: createMovieDto.publishYear,
    });

    if (existingMovie) {
      throw new ConflictException(
        'Movie with this title and publish year already exists',
      );
    }

    const newMovie = new this.movieModel(createMovieDto);
    const savedMovie = await newMovie.save();

    return {
      movie: savedMovie.toObject(),
      message: 'Movie created successfully',
    };
  }

  async findAll(
    queryDto: QueryMovieDto,
  ): Promise<{
    movies: Movie[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    message: string;
  }> {
    const { page = 1, limit = 10, search } = queryDto;

    // Build search query
    const searchQuery: any = {};
    if (search) {
      const searchConditions: any[] = [
        { title: { $regex: search, $options: 'i' } },
      ];

      // If search is a number, also search by publishYear
      if (!isNaN(Number(search))) {
        searchConditions.push({ publishYear: Number(search) });
      }

      searchQuery.$or = searchConditions;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await this.movieModel.countDocuments(searchQuery).exec();

    // Get paginated movies
    const movies = await this.movieModel
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      movies: movies.map((movie) => movie.toObject()),
      total,
      page,
      limit,
      totalPages,
      message: 'Movies retrieved successfully',
    };
  }

  async findOne(id: string): Promise<{ movie: Movie; message: string }> {
    const movie = await this.movieModel.findById(id).exec();

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return {
      movie: movie.toObject(),
      message: 'Movie retrieved successfully',
    };
  }

  async update(
    id: string,
    updateMovieDto: UpdateMovieDto,
  ): Promise<{ movie: Movie; message: string }> {
    // Check if movie exists
    const existingMovie = await this.movieModel.findById(id).exec();

    if (!existingMovie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    // If title or publishYear is being updated, check for duplicates
    if (updateMovieDto.title || updateMovieDto.publishYear) {
      const duplicateQuery: {
        title?: string;
        publishYear?: number;
        _id?: { $ne: string };
      } = {
        _id: { $ne: id },
      };

      // Use the updated values or existing values
      const titleToCheck = updateMovieDto.title ?? existingMovie.title;
      const yearToCheck =
        updateMovieDto.publishYear ?? existingMovie.publishYear;

      // Check for exact match of title and year combination
      duplicateQuery.title = titleToCheck;
      duplicateQuery.publishYear = yearToCheck;

      const duplicate = await this.movieModel.findOne(duplicateQuery).exec();

      if (duplicate) {
        throw new ConflictException(
          'Movie with this title and publish year already exists',
        );
      }
    }

    const updatedMovie = await this.movieModel
      .findByIdAndUpdate(id, updateMovieDto, { new: true })
      .exec();

    if (!updatedMovie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return {
      movie: updatedMovie.toObject(),
      message: 'Movie updated successfully',
    };
  }

  async remove(id: string): Promise<{ message: string }> {
    const movie = await this.movieModel.findByIdAndDelete(id).exec();

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return {
      message: 'Movie deleted successfully',
    };
  }
}
