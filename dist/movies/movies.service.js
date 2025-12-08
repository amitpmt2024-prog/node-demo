"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoviesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const fs_1 = require("fs");
const path_1 = require("path");
const movie_schema_1 = require("./schemas/movie.schema");
const s3_service_1 = require("../upload/s3.service");
let MoviesService = class MoviesService {
    movieModel;
    s3Service;
    constructor(movieModel, s3Service) {
        this.movieModel = movieModel;
        this.s3Service = s3Service;
    }
    getImageFilePath(imageURL) {
        if (!imageURL) {
            return null;
        }
        let filename = null;
        if (imageURL.includes('/images/')) {
            const urlParts = imageURL.split('/images/');
            if (urlParts.length > 1) {
                filename = urlParts[1].split('?')[0];
            }
        }
        if (!filename) {
            console.log(`Could not extract filename from imageURL: ${imageURL}`);
            return null;
        }
        const possiblePaths = [
            (0, path_1.join)(__dirname, '..', '..', 'public', 'images', filename),
            (0, path_1.join)(process.cwd(), 'public', 'images', filename),
            (0, path_1.join)(__dirname, '..', '..', '..', 'public', 'images', filename),
        ];
        for (const path of possiblePaths) {
            if ((0, fs_1.existsSync)(path)) {
                console.log(`✅ Found image at path: ${path}`);
                return path;
            }
        }
        const finalPath = (0, path_1.join)(__dirname, '..', '..', 'public', 'images', filename);
        console.log(`⚠️ Image not found, will try to delete: ${finalPath}`);
        return finalPath;
    }
    async deleteImageFile(imageURL) {
        if (!imageURL) {
            console.log('No image URL provided for deletion');
            return;
        }
        if (this.s3Service.isS3Url(imageURL)) {
            const s3Key = this.s3Service.extractKeyFromUrl(imageURL);
            if (s3Key) {
                await this.s3Service.deleteFile(s3Key);
                return;
            }
        }
        const imagePath = this.getImageFilePath(imageURL);
        if (!imagePath) {
            console.log('No image path resolved for deletion');
            return;
        }
        console.log(`Attempting to delete local image file: ${imagePath}`);
        console.log(`File exists: ${(0, fs_1.existsSync)(imagePath)}`);
        const filename = imagePath.split(/[/\\]/).pop();
        if (!filename) {
            console.error('Could not extract filename from path');
            return;
        }
        const pathsToTry = [
            imagePath,
            (0, path_1.join)(__dirname, '..', '..', 'public', 'images', filename),
            (0, path_1.join)(process.cwd(), 'public', 'images', filename),
            (0, path_1.join)(__dirname, '..', '..', '..', 'public', 'images', filename),
        ];
        for (const path of pathsToTry) {
            if ((0, fs_1.existsSync)(path)) {
                try {
                    (0, fs_1.unlinkSync)(path);
                    console.log(`✅ Successfully deleted local image file: ${path}`);
                    return;
                }
                catch (error) {
                    console.error(`❌ Failed to delete local image file: ${path}`, error);
                }
            }
        }
        console.warn(`⚠️ Local image file not found at any of these paths:`);
        pathsToTry.forEach((path) => console.warn(`  - ${path}`));
    }
    async create(createMovieDto, userId) {
        const existingMovie = await this.movieModel.findOne({
            title: createMovieDto.title,
            publishYear: createMovieDto.publishYear,
            createdBy: userId,
        });
        if (existingMovie) {
            throw new common_1.ConflictException('Movie with this title and publish year already exists');
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
    async findAll(queryDto, userId) {
        const { page = 1, limit = 10, search } = queryDto;
        const finalLimit = Math.max(limit, 10);
        const searchQuery = {
            createdBy: userId,
        };
        if (search) {
            const searchConditions = [
                { title: { $regex: search, $options: 'i' } },
            ];
            if (!isNaN(Number(search))) {
                searchConditions.push({ publishYear: Number(search) });
            }
            searchQuery.$or = searchConditions;
        }
        const skip = (page - 1) * finalLimit;
        const total = await this.movieModel.countDocuments(searchQuery).exec();
        const movies = await this.movieModel
            .find(searchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(finalLimit)
            .exec();
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
    async findOne(id, userId) {
        const movie = await this.movieModel.findOne({
            _id: id,
            createdBy: userId,
        }).exec();
        if (!movie) {
            throw new common_1.NotFoundException(`Movie with ID ${id} not found`);
        }
        return {
            movie: movie.toObject(),
            message: 'Movie retrieved successfully',
        };
    }
    async update(id, updateMovieDto, userId) {
        const existingMovie = await this.movieModel.findOne({
            _id: id,
            createdBy: userId,
        }).exec();
        if (!existingMovie) {
            throw new common_1.NotFoundException(`Movie with ID ${id} not found`);
        }
        if (updateMovieDto.imageURL && updateMovieDto.imageURL !== existingMovie.imageURL) {
            console.log(`Updating image: Old URL: ${existingMovie.imageURL}, New URL: ${updateMovieDto.imageURL}`);
            await this.deleteImageFile(existingMovie.imageURL);
        }
        if (updateMovieDto.title || updateMovieDto.publishYear) {
            const duplicateQuery = {
                _id: { $ne: id },
                createdBy: userId,
            };
            const titleToCheck = updateMovieDto.title ?? existingMovie.title;
            const yearToCheck = updateMovieDto.publishYear ?? existingMovie.publishYear;
            duplicateQuery.title = titleToCheck;
            duplicateQuery.publishYear = yearToCheck;
            const duplicate = await this.movieModel.findOne(duplicateQuery).exec();
            if (duplicate) {
                throw new common_1.ConflictException('Movie with this title and publish year already exists');
            }
        }
        const updatedMovie = await this.movieModel
            .findByIdAndUpdate(id, updateMovieDto, { new: true })
            .exec();
        if (!updatedMovie) {
            throw new common_1.NotFoundException(`Movie with ID ${id} not found`);
        }
        return {
            movie: updatedMovie.toObject(),
            message: 'Movie updated successfully',
        };
    }
    async remove(id, userId) {
        const movie = await this.movieModel.findOne({
            _id: id,
            createdBy: userId,
        }).exec();
        if (!movie) {
            throw new common_1.NotFoundException(`Movie with ID ${id} not found`);
        }
        await this.movieModel.findByIdAndDelete(id).exec();
        console.log(`Deleting image with URL: ${movie.imageURL}`);
        await this.deleteImageFile(movie.imageURL);
        return {
            message: 'Movie deleted successfully',
        };
    }
};
exports.MoviesService = MoviesService;
exports.MoviesService = MoviesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(movie_schema_1.Movie.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        s3_service_1.S3Service])
], MoviesService);
//# sourceMappingURL=movies.service.js.map