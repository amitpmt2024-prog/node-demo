import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { QueryMovieDto } from './dto/query-movie.dto';
export declare class MoviesController {
    private readonly moviesService;
    constructor(moviesService: MoviesService);
    create(createMovieDto: CreateMovieDto): Promise<{
        movie: import("./schemas/movie.schema").Movie;
        message: string;
    }>;
    findAll(queryDto: QueryMovieDto): Promise<{
        movies: import("./schemas/movie.schema").Movie[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        message: string;
    }>;
    findOne(id: string): Promise<{
        movie: import("./schemas/movie.schema").Movie;
        message: string;
    }>;
    update(id: string, updateMovieDto: UpdateMovieDto): Promise<{
        movie: import("./schemas/movie.schema").Movie;
        message: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
