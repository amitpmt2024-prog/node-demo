import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Serve static files from public folder (without /api prefix)
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
  });

  // Serve frontend build in production (if dist folder exists)
  const frontendDistPath = join(__dirname, '..', '..', 'react', 'dist');
  if (existsSync(frontendDistPath)) {
    // Serve static assets from frontend dist
    app.useStaticAssets(frontendDistPath, {
      prefix: '/',
      index: false,
    });
    // Serve index.html for all non-API routes (SPA fallback)
    // Use use() instead of get() for catch-all route
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.use((req: Request, res: Response, next: NextFunction) => {
      // Skip if it's an API route, image route, or already handled static file
      if (req.path.startsWith('/api') || req.path.startsWith('/images')) {
        return next();
      }
      // Skip if it's a file request (has extension)
      if (req.path.includes('.')) {
        return next();
      }
      // Serve index.html for SPA routes
      res.sendFile(join(frontendDistPath, 'index.html'));
    });
  }

  // Enable CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
        'http://3.110.108.83', // Vite default port
        'http://localhost:3000', // React dev server
        'http://localhost:5174', // Alternative Vite port
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
      ];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Enable global response transformation
  app.useGlobalInterceptors(new TransformInterceptor());

  // Enable global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Get MongoDB connection
  const connection = app.get<Connection>(getConnectionToken());
  // Log connection events
  connection.on('connected', () => {
    console.log('✅ MongoDB connected successfully');
  });

  connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });

  connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
  });

  // Check initial connection state
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
