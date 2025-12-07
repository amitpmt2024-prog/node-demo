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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMovieDto = void 0;
const class_validator_1 = require("class-validator");
class CreateMovieDto {
    title;
    publishYear;
    imageURL;
}
exports.CreateMovieDto = CreateMovieDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Title is required' }),
    (0, class_validator_1.MinLength)(1, { message: 'Title cannot be empty' }),
    (0, class_validator_1.MaxLength)(200, { message: 'Title cannot exceed 200 characters' }),
    __metadata("design:type", String)
], CreateMovieDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1888, { message: 'Publish year must be at least 1888' }),
    (0, class_validator_1.Max)(new Date().getFullYear() + 1, {
        message: 'Publish year cannot be in the future',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Publish year is required' }),
    __metadata("design:type", Number)
], CreateMovieDto.prototype, "publishYear", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Image URL is required' }),
    __metadata("design:type", String)
], CreateMovieDto.prototype, "imageURL", void 0);
//# sourceMappingURL=create-movie.dto.js.map