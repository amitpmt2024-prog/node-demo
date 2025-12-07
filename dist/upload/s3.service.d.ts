export declare class S3Service {
    private readonly logger;
    private readonly s3Client;
    private readonly bucketName;
    private readonly region;
    constructor();
    uploadFile(file: Buffer, filename: string, mimetype: string): Promise<{
        key: string;
        url: string;
    }>;
    deleteFile(key: string): Promise<void>;
    extractKeyFromUrl(imageURL: string | undefined): string | null;
    isS3Url(imageURL: string | undefined): boolean;
}
