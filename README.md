Installation Steps
1. Clone the Frontend Repository
git clone <repository-url>
cd <project-folder>

2. Install Dependencies

Install all required packages:

npm install


If you encounter any installation errors, you can force install:

npm install --force

3. Configure Environment Variables

Update your .env file with the required AWS S3 credentials for image uploads:

AWS_REGION=<your-aws-region>
AWS_ACCESS_KEY_ID=<your-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
AWS_S3_BUCKET_NAME=<your-s3-bucket-name>

4. Start the Application

Run the development server:

npm start