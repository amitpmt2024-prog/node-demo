"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const mongoose_1 = require("@nestjs/mongoose");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const path_1 = require("path");
const fs_1 = require("fs");
(0, dotenv_1.config)();
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'public'), {
        prefix: '/',
    });
    const frontendDistPath = (0, path_1.join)(__dirname, '..', '..', 'react', 'dist');
    if ((0, fs_1.existsSync)(frontendDistPath)) {
        app.useStaticAssets(frontendDistPath, {
            prefix: '/',
            index: false,
        });
        const expressApp = app.getHttpAdapter().getInstance();
        expressApp.use((req, res, next) => {
            if (req.path.startsWith('/api') || req.path.startsWith('/images')) {
                return next();
            }
            if (req.path.includes('.')) {
                return next();
            }
            res.sendFile((0, path_1.join)(frontendDistPath, 'index.html'));
        });
    }
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : [
            'http://3.110.108.83',
            'http://localhost:3000',
        ];
    app.enableCors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const connection = app.get((0, mongoose_1.getConnectionToken)());
    connection.on('connected', () => {
        console.log('✅ MongoDB connected successfully');
    });
    connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
    });
    connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected');
    });
    const state = connection.readyState;
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };
    console.log(`🔌 MongoDB connection state: ${states[state] || 'unknown'}`);
    const port = process.env.PORT ?? 3000;
    const host = process.env.HOST ?? '0.0.0.0';
    await app.listen(port, host);
    console.log(`🚀 Application is running on: http://${host}:${port}`);
    console.log(`🔌 API endpoints available at: http://${host}:${port}/api`);
    console.log(`🏥 Health check available at: http://${host}:${port}/api`);
}
void bootstrap();
//# sourceMappingURL=main.js.map