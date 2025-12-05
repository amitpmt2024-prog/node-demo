import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Movie, MovieDocument } from './schemas/movie.schema';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { QueryMovieDto } from './dto/query-movie.dto';

@Injectable()
export class MoviesService {
  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
  ) {}

  /**
   * Helper method to extract filename from imageURL and get full file path
   * Uses the same path resolution as upload.controller.ts
   */
  private getImageFilePath(imageURL: string | undefined): string | null {
    if (!imageURL) {
      return null;
    }

    // Extract filename from URL
    // imageURL format: http://localhost:3000/images/filename.jpg or /images/filename.jpg
    let filename: string | null = null;

    if (imageURL.includes('/images/')) {
      const urlParts = imageURL.split('/images/');
      if (urlParts.length > 1) {
        filename = urlParts[1].split('?')[0]; // Remove query params if any
      }
    }

    if (!filename) {
      console.log(`Could not extract filename from imageURL: ${imageURL}`);
      return null;
    }

    // Try multiple path resolution strategies to handle both dev and production
    const possiblePaths = [
      // Strategy 1: Same as upload.controller.ts (for compiled code)
      join(__dirname, '..', '..', 'public', 'images', filename),
      // Strategy 2: Using process.cwd() (for dev mode)
      join(process.cwd(), 'public', 'images', filename),
      // Strategy 3: From dist folder
      join(__dirname, '..', '..', '..', 'public', 'images', filename),
    ];

    // Try each path and return the first one that exists
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        console.log(`✅ Found image at path: ${path}`);
        return path;
      }
    }

    // If none exist, return the most likely one (same as upload controller)
    const finalPath = join(__dirname, '..', '..', 'public', 'images', filename);
    console.log(`⚠️ Image not found, will try to delete: ${finalPath}`);
    return finalPath;
  }

  /**
   * Helper method to delete image file from filesystem
   */
  private deleteImageFile(imagePath: string | null): void {
    if (!imagePath) {
      console.log('No image path provided for deletion');
      return;
    }

    console.log(`Attempting to delete image file: ${imagePath}`);
    console.log(`File exists: ${existsSync(imagePath)}`);

    // Extract filename for fallback attempts
    const filename = imagePath.split(/[/\\]/).pop();
    
    if (!filename) {
      console.error('Could not extract filename from path');
      return;
    }

    // List of possible paths to try
    const pathsToTry = [
      imagePath, // Try the provided path first
      join(__dirname, '..', '..', 'public', 'images', filename),
      join(process.cwd(), 'public', 'images', filename),
      join(__dirname, '..', '..', '..', 'public', 'images', filename),
    ];

    // Try each path until we find and delete the file
    for (const path of pathsToTry) {
      if (existsSync(path)) {
        try {
          unlinkSync(path);
          console.log(`✅ Successfully deleted image file: ${path}`);
          return; // Successfully deleted, exit
        } catch (error) {
          console.error(`❌ Failed to delete image file: ${path}`, error);
          // Continue to next path
        }
      }
    }

    // If we get here, file wasn't found at any path
    console.warn(`⚠️ Image file not found at any of these paths:`);
    pathsToTry.forEach((path) => console.warn(`  - ${path}`));
  }

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

    // If a new image is being uploaded, delete the old image
    if (updateMovieDto.imageURL && updateMovieDto.imageURL !== existingMovie.imageURL) {
      console.log(`Updating image: Old URL: ${existingMovie.imageURL}, New URL: ${updateMovieDto.imageURL}`);
      const oldImagePath = this.getImageFilePath(existingMovie.imageURL);
      console.log(`Old image path resolved to: ${oldImagePath}`);
      this.deleteImageFile(oldImagePath);
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
    // Find the movie first to get the image URL
    const movie = await this.movieModel.findById(id).exec();

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    // Get the image file path before deleting the movie
    console.log(`Deleting movie with imageURL: ${movie.imageURL}`);
    const imagePath = this.getImageFilePath(movie.imageURL);
    console.log(`Image path resolved to: ${imagePath}`);

    // Delete the movie from database
    await this.movieModel.findByIdAndDelete(id).exec();

    // Delete the image file if it exists
    this.deleteImageFile(imagePath);

    return {
      message: 'Movie deleted successfully',
    };
  }
}
