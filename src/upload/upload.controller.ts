import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { S3Service } from './s3.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(), // Store in memory instead of disk
      fileFilter: (req, file, cb) => {
        // Accept only image files
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadImage(
    @UploadedFile()
    file: {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    } | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }

    // Generate unique filename: timestamp-randomnumber-originalname
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;

    // Upload to S3
    const { url } = await this.s3Service.uploadFile(
      file.buffer,
      filename,
      file.mimetype,
    );

    return {
      imageURL: url,
      filename: filename,
      message: 'Image uploaded successfully',
    };
  }
}

