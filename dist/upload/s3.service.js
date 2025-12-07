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
var S3Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
let S3Service = S3Service_1 = class S3Service {
    logger = new common_1.Logger(S3Service_1.name);
    s3Client;
    bucketName;
    region;
    constructor() {
        this.region = process.env.AWS_REGION || 'us-east-1';
        this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'assement-practical';
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        if (!accessKeyId || !secretAccessKey) {
            this.logger.error('AWS credentials are missing! Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file');
            throw new Error('AWS credentials are not configured. Please check your .env file.');
        }
        if (!this.bucketName) {
            this.logger.error('AWS S3 bucket name is missing! Please set AWS_S3_BUCKET_NAME in .env file');
            throw new Error('AWS S3 bucket name is not configured. Please check your .env file.');
        }
        this.s3Client = new client_s3_1.S3Client({
            region: this.region,
            credentials: {
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
            },
        });
        this.logger.log(`S3 Service initialized for bucket: ${this.bucketName} in region: ${this.region}`);
    }
    async uploadFile(file, filename, mimetype) {
        try {
            const key = `images/${filename}`;
            const commandParams = {
                Bucket: this.bucketName,
                Key: key,
                Body: file,
                ContentType: mimetype,
            };
            let command = new client_s3_1.PutObjectCommand({
                ...commandParams,
                ACL: 'public-read',
            });
            try {
                await this.s3Client.send(command);
            }
            catch (aclError) {
                if (aclError.name === 'AccessControlListNotSupported' ||
                    aclError.code === 'AccessControlListNotSupported' ||
                    aclError.message?.includes('ACL') ||
                    aclError.message?.includes('access control list')) {
                    this.logger.warn('Bucket has ACLs disabled, uploading without ACL. Ensure bucket policy allows public read access.');
                    command = new client_s3_1.PutObjectCommand(commandParams);
                    await this.s3Client.send(command);
                }
                else {
                    throw aclError;
                }
            }
            const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
            this.logger.log(`File uploaded successfully: ${key}`);
            this.logger.log(`Public URL: ${url}`);
            return { key, url };
        }
        catch (error) {
            this.logger.error('Error uploading file to S3:', error);
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
    async deleteFile(key) {
        try {
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            await this.s3Client.send(command);
            this.logger.log(`File deleted successfully from S3: ${key}`);
        }
        catch (error) {
            this.logger.error(`Error deleting file from S3 (${key}):`, error);
        }
    }
    extractKeyFromUrl(imageURL) {
        if (!imageURL) {
            return null;
        }
        if (imageURL.startsWith('images/')) {
            return imageURL;
        }
        if (imageURL.startsWith('/images/')) {
            return imageURL.substring(1);
        }
        if (imageURL.includes('.s3.') || imageURL.includes('s3.amazonaws.com')) {
            const urlParts = imageURL.split('/');
            const bucketIndex = urlParts.findIndex((part) => part.includes('s3') || part.includes(this.bucketName));
            if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
                const keyParts = urlParts.slice(bucketIndex + 1);
                return keyParts.join('/');
            }
            const match = imageURL.match(/images\/[^?]+/);
            if (match) {
                return match[0];
            }
        }
        this.logger.warn(`Could not extract S3 key from URL: ${imageURL}`);
        return null;
    }
    isS3Url(imageURL) {
        if (!imageURL) {
            return false;
        }
        return (imageURL.includes('.s3.') ||
            imageURL.includes('s3.amazonaws.com') ||
            imageURL.startsWith('images/'));
    }
};
exports.S3Service = S3Service;
exports.S3Service = S3Service = S3Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], S3Service);
//# sourceMappingURL=s3.service.js.map