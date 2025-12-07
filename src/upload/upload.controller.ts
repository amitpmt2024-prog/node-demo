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
    file:
      | {
          fieldname: string;
          originalname: string;
          encoding: string;
          mimetype: string;
          size: number;
          buffer: Buffer;
        }
      | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }

    // Generate unique filename: timestamp-randomnumber-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;

    // IMPORTANT: This endpoint ONLY uploads to S3, never saves to local disk
    console.log(
      `[UploadController] Starting S3 upload for file: ${filename}, size: ${file.size} bytes`,
    );

    try {
      // Upload to S3 - this is the ONLY place images should be uploaded
      // NO local file saving happens here - files are stored in memory and uploaded directly to S3
      const { url } = await this.s3Service.uploadFile(
        file.buffer,
        filename,
        file.mimetype,
      );

      console.log(`[UploadController] Successfully uploaded to S3: ${url}`);

      return {
        imageURL: url,
        filename: filename,
        message: 'Image uploaded successfully to S3',
      };
    } catch (error: unknown) {
      // Log the error for debugging
      const err = error as {
        name?: string;
        code?: string;
        message?: string;
        stack?: string;
      };
      console.error('[UploadController] S3 upload error:', error);
      console.error('[UploadController] Error details:', {
        name: err?.name,
        code: err?.code,
        message: err?.message,
        stack: err?.stack,
      });

      // Re-throw with a more user-friendly message
      // DO NOT save to local disk as fallback - fail explicitly
      throw new BadRequestException(
        `Failed to upload image to S3: ${err?.message || 'Unknown error'}. Please check AWS credentials and S3 bucket configuration.`,
      );
    }
  }
}
