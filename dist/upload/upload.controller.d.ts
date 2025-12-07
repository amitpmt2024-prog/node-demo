import { S3Service } from './s3.service';
export declare class UploadController {
    private readonly s3Service;
    constructor(s3Service: S3Service);
    uploadImage(file: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
    } | undefined): Promise<{
        imageURL: string;
        filename: string;
        message: string;
    }>;
}
