import { Model } from 'mongoose';
import { Movie, MovieDocument } from './schemas/movie.schema';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { QueryMovieDto } from './dto/query-movie.dto';
import { S3Service } from '../upload/s3.service';
export declare class MoviesService {
    private movieModel;
    private readonly s3Service;
    constructor(movieModel: Model<MovieDocument>, s3Service: S3Service);
    private getImageFilePath;
    private deleteImageFile;
    create(createMovieDto: CreateMovieDto, userId: string): Promise<{
        movie: Movie;
        message: string;
    }>;
    findAll(queryDto: QueryMovieDto, userId: string): Promise<{
        movies: Movie[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        message: string;
    }>;
    findOne(id: string, userId: string): Promise<{
        movie: Movie;
        message: string;
    }>;
    update(id: string, updateMovieDto: UpdateMovieDto, userId: string): Promise<{
        movie: Movie;
        message: string;
    }>;
    remove(id: string, userId: string): Promise<{
        message: string;
    }>;
}
