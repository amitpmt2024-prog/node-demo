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
import { S3Service } from '../upload/s3.service';

@Injectable()
export class MoviesService {
  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    private readonly s3Service: S3Service,
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
   * Helper method to delete image file from filesystem or S3
   */
  private async deleteImageFile(imageURL: string | undefined): Promise<void> {
    if (!imageURL) {
      console.log('No image URL provided for deletion');
      return;
    }

    // Check if it's an S3 URL
    if (this.s3Service.isS3Url(imageURL)) {
      const s3Key = this.s3Service.extractKeyFromUrl(imageURL);
      if (s3Key) {
        await this.s3Service.deleteFile(s3Key);
        return;
      }
    }

    // Fallback to local file system deletion (for backward compatibility)
    const imagePath = this.getImageFilePath(imageURL);
    if (!imagePath) {
      console.log('No image path resolved for deletion');
      return;
    }

    console.log(`Attempting to delete local image file: ${imagePath}`);
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
          console.log(`✅ Successfully deleted local image file: ${path}`);
          return; // Successfully deleted, exit
        } catch (error) {
          console.error(`❌ Failed to delete local image file: ${path}`, error);
          // Continue to next path
        }
      }
    }

    // If we get here, file wasn't found at any path
    console.warn(`⚠️ Local image file not found at any of these paths:`);
    pathsToTry.forEach((path) => console.warn(`  - ${path}`));
  }

  async create(
    createMovieDto: CreateMovieDto,
    userId: string,
  ): Promise<{ movie: Movie; message: string }> {
    // Check if movie with same title and year already exists for this user
    const existingMovie = await this.movieModel.findOne({
      title: createMovieDto.title,
      publishYear: createMovieDto.publishYear,
      createdBy: userId,
    });

    if (existingMovie) {
      throw new ConflictException(
        'Movie with this title and publish year already exists',
      );
    }

    const newMovie = new this.movieModel({
      ...createMovieDto,
      createdBy: userId,
    });
    const savedMovie = await newMovie.save();

    return {
      movie: savedMovie.toObject(),
      message: 'Movie created successfully',
    };
  }

  async findAll(
    queryDto: QueryMovieDto,
    userId: string,
  ): Promise<{
    movies: Movie[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    message: string;
  }> {
    const { page = 1, limit = 10, search } = queryDto;

    // Ensure minimum limit of 10
    const finalLimit = Math.max(limit, 10);

    // Build search query - filter by createdBy first
    const searchQuery: any = {
      createdBy: userId,
    };

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
    const skip = (page - 1) * finalLimit;

    // Get total count for pagination
    const total = await this.movieModel.countDocuments(searchQuery).exec();

    // Get paginated movies
    const movies = await this.movieModel
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(finalLimit)
      .exec();

    // Calculate total pages
    const totalPages = Math.ceil(total / finalLimit);

    return {
      movies: movies.map((movie) => movie.toObject()),
      total,
      page,
      limit: finalLimit,
      totalPages,
      message: 'Movies retrieved successfully',
    };
  }

  async findOne(id: string, userId: string): Promise<{ movie: Movie; message: string }> {
    const movie = await this.movieModel.findOne({
      _id: id,
      createdBy: userId,
    }).exec();

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
    userId: string,
  ): Promise<{ movie: Movie; message: string }> {
    // Check if movie exists and belongs to the user
    const existingMovie = await this.movieModel.findOne({
      _id: id,
      createdBy: userId,
    }).exec();

    if (!existingMovie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    // If a new image is being uploaded, delete the old image
    if (updateMovieDto.imageURL && updateMovieDto.imageURL !== existingMovie.imageURL) {
      console.log(`Updating image: Old URL: ${existingMovie.imageURL}, New URL: ${updateMovieDto.imageURL}`);
      await this.deleteImageFile(existingMovie.imageURL);
    }

    // If title or publishYear is being updated, check for duplicates (only for this user)
    if (updateMovieDto.title || updateMovieDto.publishYear) {
      const duplicateQuery: {
        title?: string;
        publishYear?: number;
        createdBy?: string;
        _id?: { $ne: string };
      } = {
        _id: { $ne: id },
        createdBy: userId,
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

  async remove(id: string, userId: string): Promise<{ message: string }> {
    // Find the movie first to get the image URL and verify ownership
    const movie = await this.movieModel.findOne({
      _id: id,
      createdBy: userId,
    }).exec();

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    // Delete the movie from database first
    await this.movieModel.findByIdAndDelete(id).exec();

    // Delete the image file from S3 or local filesystem
    console.log(`Deleting image with URL: ${movie.imageURL}`);
    await this.deleteImageFile(movie.imageURL);

    return {
      message: 'Movie deleted successfully',
    };
  }
}
