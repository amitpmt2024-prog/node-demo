import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MoviesModule } from './movies/movies.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/demo'),
    UsersModule,
    MoviesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
