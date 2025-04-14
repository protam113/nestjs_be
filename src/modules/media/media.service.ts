import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MediaService {
  private readonly AUTH_URL: string;
  private readonly BASE_URL: string;
  private readonly SWIFT_USERNAME: string;
  private readonly SWIFT_PASSWORD: string;
  private readonly PROJECT_ID: string;

  private readonly redis = require('redis');
  private client;

  constructor(private readonly configService: ConfigService) {
    // Get required config values or throw error if missing
    this.AUTH_URL = this.getRequiredConfig('AUTH_URL');
    this.BASE_URL = this.getRequiredConfig('BASE_URL');
    this.SWIFT_USERNAME = this.getRequiredConfig('SWIFT_USERNAME');
    this.SWIFT_PASSWORD = this.getRequiredConfig('SWIFT_PASSWORD');
    this.PROJECT_ID = this.getRequiredConfig('PROJECT_ID');

    // Initialize Redis client with async connection
    this.initRedisClient();
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
    return value;
  }

  private async initRedisClient() {
    this.client = this.redis.createClient({
      url:
        this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
    });

    await this.client.connect().catch((err) => {
      console.error('Redis connection error:', err);
    });
  }

  async getAuthToken(): Promise<string> {
    let token = await this.client.get('XAuthToken');

    if (!token) {
      const authPayload = {
        auth: {
          identity: {
            methods: ['password'],
            password: {
              user: {
                domain: { name: 'default' },
                name: this.SWIFT_USERNAME,
                password: this.SWIFT_PASSWORD,
              },
            },
          },
          scope: {
            project: {
              domain: { name: 'default' },
              id: this.PROJECT_ID,
            },
          },
        },
      };

      try {
        const response = await axios.post(this.AUTH_URL, authPayload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        token = response.headers['x-subject-token'];

        if (token) {
          await this.client.set('XAuthToken', token, {
            EX: 3600,
          });
        }
      } catch (error) {
        throw new Error('Error fetching token from VStorage: ' + error.message);
      }
    }

    return token;
  }

  async uploadFile(
    folderPath: string,
    file: Express.Multer.File
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException({
        message: 'No file provided',
        code: 'FILE_REQUIRED',
      });
    }

    const authToken = await this.getAuthToken();

    const sanitizedPath = folderPath.replace(/^\/+|\/+$/g, '');
    const uploadPath = `${this.BASE_URL}${sanitizedPath}/${file.originalname}`;

    try {
      const response = await axios.put(uploadPath, file.buffer, {
        headers: {
          'X-Auth-Token': authToken,
          'Content-Type': file.mimetype,
        },
      });

      if (response.status === 201) {
        return { url: uploadPath };
      } else {
        throw new BadRequestException({
          message: 'Failed to upload file to storage',
          code: 'UPLOAD_FAILED',
        });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new BadRequestException({
          message: 'Authentication failed for file upload',
          code: 'AUTH_FAILED',
        });
      }
      throw new BadRequestException({
        message: 'File upload failed',
        details: error.message,
        code: 'UPLOAD_ERROR',
      });
    }
  }
}
