import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'assement-practical';

    // Validate AWS credentials
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      this.logger.error(
        'AWS credentials are missing! Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file',
      );
      throw new Error(
        'AWS credentials are not configured. Please check your .env file.',
      );
    }

    if (!this.bucketName) {
      this.logger.error(
        'AWS S3 bucket name is missing! Please set AWS_S3_BUCKET_NAME in .env file',
      );
      throw new Error(
        'AWS S3 bucket name is not configured. Please check your .env file.',
      );
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    this.logger.log(`S3 Service initialized for bucket: ${this.bucketName} in region: ${this.region}`);
  }

  /**
   * Upload a file to S3
   * @param file Buffer of the file to upload
   * @param filename Name of the file
   * @param mimetype MIME type of the file
   * @returns Promise with the S3 key and public URL
   */
  async uploadFile(
    file: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<{ key: string; url: string }> {
    try {
      const key = `images/${filename}`;

      // Build command without ACL first (for buckets with ACLs disabled)
      // If ACLs are enabled, you can add ACL: 'public-read' to the command
      const commandParams: any = {
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: mimetype,
      };

      // Try with ACL first, if it fails, retry without ACL
      // This handles both buckets with ACLs enabled and disabled
      let command = new PutObjectCommand({
        ...commandParams,
        ACL: 'public-read',
      });

      try {
        await this.s3Client.send(command);
      } catch (aclError: any) {
        // If ACL error (bucket has ACLs disabled), retry without ACL
        if (
          aclError.name === 'AccessControlListNotSupported' ||
          aclError.code === 'AccessControlListNotSupported' ||
          aclError.message?.includes('ACL') ||
          aclError.message?.includes('access control list')
        ) {
          this.logger.warn(
            'Bucket has ACLs disabled, uploading without ACL. Ensure bucket policy allows public read access.',
          );
          command = new PutObjectCommand(commandParams);
          await this.s3Client.send(command);
        } else {
          throw aclError;
        }
      }

      // Construct the public URL
      // Note: For buckets with ACLs disabled, ensure bucket policy allows public read
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      this.logger.log(`File uploaded successfully: ${key}`);
      this.logger.log(`Public URL: ${url}`);
      return { key, url };
    } catch (error: any) {
      this.logger.error('Error uploading file to S3:', error);
      
      // Provide more helpful error messages
      if (error.name === 'InvalidAccessKeyId' || error.code === 'InvalidAccessKeyId') {
        throw new Error('Invalid AWS Access Key ID. Please check your AWS_ACCESS_KEY_ID in .env file.');
      }
      if (error.name === 'SignatureDoesNotMatch' || error.code === 'SignatureDoesNotMatch') {
        throw new Error('Invalid AWS Secret Access Key. Please check your AWS_SECRET_ACCESS_KEY in .env file.');
      }
      if (error.name === 'NoSuchBucket' || error.code === 'NoSuchBucket') {
        throw new Error(`S3 bucket "${this.bucketName}" does not exist. Please check your AWS_S3_BUCKET_NAME in .env file.`);
      }
      if (error.name === 'AccessDenied' || error.code === 'AccessDenied') {
        throw new Error(`Access denied to S3 bucket "${this.bucketName}". Please check your AWS IAM permissions.`);
      }
      
      throw new Error(`S3 upload failed: ${error.message || error}`);
    }
  }

  /**
   * Delete a file from S3
   * @param key S3 key (path) of the file to delete
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully from S3: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file from S3 (${key}):`, error);
      // Don't throw error, just log it (file might not exist)
    }
  }

  /**
   * Extract S3 key from image URL
   * @param imageURL Full S3 URL or path
   * @returns S3 key or null if not a valid S3 URL
   */
  extractKeyFromUrl(imageURL: string | undefined): string | null {
    if (!imageURL) {
      return null;
    }

    // Handle different URL formats:
    // 1. https://bucket-name.s3.region.amazonaws.com/images/filename.jpg
    // 2. https://s3.region.amazonaws.com/bucket-name/images/filename.jpg
    // 3. /images/filename.jpg (legacy local path)
    // 4. images/filename.jpg (just the key)

    // If it's already just a key (starts with images/)
    if (imageURL.startsWith('images/')) {
      return imageURL;
    }

    // If it's a local path (starts with /images/)
    if (imageURL.startsWith('/images/')) {
      return imageURL.substring(1); // Remove leading slash
    }

    // If it's a full S3 URL
    if (imageURL.includes('.s3.') || imageURL.includes('s3.amazonaws.com')) {
      // Extract the key part after the bucket name
      const urlParts = imageURL.split('/');
      const bucketIndex = urlParts.findIndex(
        (part) => part.includes('s3') || part.includes(this.bucketName),
      );

      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        // Get everything after the bucket name
        const keyParts = urlParts.slice(bucketIndex + 1);
        return keyParts.join('/');
      }

      // Fallback: try to extract from common patterns
      const match = imageURL.match(/images\/[^?]+/);
      if (match) {
        return match[0];
      }
    }

    this.logger.warn(`Could not extract S3 key from URL: ${imageURL}`);
    return null;
  }

  /**
   * Check if a URL is an S3 URL
   * @param imageURL URL to check
   * @returns true if it's an S3 URL
   */
  isS3Url(imageURL: string | undefined): boolean {
    if (!imageURL) {
      return false;
    }

    return (
      imageURL.includes('.s3.') ||
      imageURL.includes('s3.amazonaws.com') ||
      imageURL.startsWith('images/')
    );
  }
}

