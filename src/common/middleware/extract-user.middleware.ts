import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class ExtractUserMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        // Decode JWT token
        const payload = this.jwtService.decode(token) as JwtPayload;
        
        if (payload && payload.userId) {
          // Attach userId to request object
          (req as any).userId = payload.userId;
        }
      } catch (error) {
        // If decoding fails, continue without userId
        // The JWT guard will handle authentication errors
        console.error('Error decoding JWT token in middleware:', error);
      }
    }
    
    next();
  }
}
