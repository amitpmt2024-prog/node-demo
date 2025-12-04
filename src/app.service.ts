import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class AppService {
  constructor(@InjectConnection() private connection: Connection) {}

  getHello(): string {
    return 'Hello World!';
  }

  checkDatabaseConnection(): {
    connected: boolean;
    message: string;
    database?: string;
  } {
    try {
      const state: number = this.connection.readyState;
      const isConnected = Number(state) === 1; // 1 = connected

      if (isConnected) {
        return {
          connected: true,
          message: 'Database connected successfully',
          database: this.connection.db?.databaseName,
        };
      } else {
        const states: Record<number, string> = {
          0: 'disconnected',
          1: 'connected',
          2: 'connecting',
          3: 'disconnecting',
        };
        return {
          connected: false,
          message: `Database connection state: ${states[state] || 'unknown'}`,
        };
      }
    } catch (error) {
      return {
        connected: false,
        message: `Error checking database connection: ${(error as Error).message}`,
      };
    }
  }
}
