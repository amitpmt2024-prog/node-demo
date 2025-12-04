import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const statusCode = context.switchToHttp().getResponse().statusCode || 200;

    return next.handle().pipe(
      map((data) => {
        // If data already has the ApiResponse structure, return it as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data as ApiResponse<T>;
        }

        // Extract message if it exists in the data
        const message = this.extractMessage(data);
        let responseData = data;

        // If data has both user and message, extract user as data and message separately
        if (
          data &&
          typeof data === 'object' &&
          'user' in data &&
          'message' in data
        ) {
          responseData = data.user;
        }

        // Otherwise, wrap it in the standard format
        return {
          success: true,
          statusCode,
          message: message || 'Request successful',
          data: responseData,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }

  private extractMessage(data: any): string | undefined {
    if (data && typeof data === 'object') {
      // Extract message if it exists
      if (data.message) {
        return data.message;
      }
    }
    return undefined;
  }
}
