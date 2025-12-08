"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoviesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const movies_controller_1 = require("./movies.controller");
const movies_service_1 = require("./movies.service");
const movie_schema_1 = require("./schemas/movie.schema");
const auth_module_1 = require("../auth/auth.module");
const upload_module_1 = require("../upload/upload.module");
const extract_user_middleware_1 = require("../common/middleware/extract-user.middleware");
const jwt_1 = require("@nestjs/jwt");
let MoviesModule = class MoviesModule {
    configure(consumer) {
        consumer
            .apply(extract_user_middleware_1.ExtractUserMiddleware)
            .forRoutes('movies');
    }
};
exports.MoviesModule = MoviesModule;
exports.MoviesModule = MoviesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: movie_schema_1.Movie.name, schema: movie_schema_1.MovieSchema }]),
            auth_module_1.AuthModule,
            upload_module_1.UploadModule,
            jwt_1.JwtModule.register({
                secret: '222fed36629593d6a11d4f19daca0576',
            }),
        ],
        controllers: [movies_controller_1.MoviesController],
        providers: [movies_service_1.MoviesService, extract_user_middleware_1.ExtractUserMiddleware],
        exports: [movies_service_1.MoviesService],
    })
], MoviesModule);
//# sourceMappingURL=movies.module.js.map