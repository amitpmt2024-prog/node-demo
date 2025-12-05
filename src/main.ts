import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:5173', // Vite default port
      'http://localhost:3000', // React dev server
      'http://localhost:5174', // Alternative Vite port
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ],
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
    console.log(`📊 Database: ${connection.db?.databaseName}`);
    console.log(`🔗 Host: ${connection.host}`);
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

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `🏥 Health check available at: http://localhost:${process.env.PORT ?? 3000}/health`,
  );
}
void bootstrap();
