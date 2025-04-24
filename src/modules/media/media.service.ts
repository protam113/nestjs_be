import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RedisCacheService } from '../cache/redis-cache.service';

@Injectable()
export class MediaService {
  private readonly AUTH_URL: string;
  private readonly BASE_URL: string;
  private readonly SWIFT_USERNAME: string;
  private readonly SWIFT_PASSWORD: string;
  private readonly PROJECT_ID: string;

  private readonly redis = require('redis');
  private client;

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: RedisCacheService // Thêm vô đây
  ) {
    // Get required config values or throw error if missing
    this.AUTH_URL = this.getRequiredConfig('AUTH_URL');
    this.BASE_URL = this.getRequiredConfig('BASE_URL');
    this.SWIFT_USERNAME = this.getRequiredConfig('SWIFT_USERNAME');
    this.SWIFT_PASSWORD = this.getRequiredConfig('SWIFT_PASSWORD');
    this.PROJECT_ID = this.getRequiredConfig('PROJECT_ID');
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
    return value;
  }
  async getAuthToken(): Promise<string> {
    let token = (await this.cacheService.get('XAuthToken')) as string;

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
          await this.cacheService.set('XAuthToken', token, 3600);
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

  async deleteFiles(
    fileUrls: string[]
  ): Promise<{ message: string; deleted: string[] }> {
    if (!fileUrls || fileUrls.length === 0) {
      throw new BadRequestException({
        message: 'No file URLs provided',
        code: 'FILES_REQUIRED',
      });
    }

    const authToken = await this.getAuthToken();
    const containerName = this.getRequiredConfig('CONTAINER_NAME'); // Ensure it's set properly

    // Chỉnh sửa phần này để xử lý URL đầy đủ
    const filePaths = fileUrls.map((url) => {
      try {
        const parsed = new URL(url); // Parse full URL
        const fullPath = parsed.pathname; // /v1/AUTH_xxx/cdn/hust4l/desc/fb.png
        const idx = fullPath.indexOf(containerName); // Ensure that the container name is correct
        if (idx === -1)
          throw new Error('Invalid URL or missing container name');
        return fullPath.slice(idx + containerName.length + 1); // Skip container part
      } catch (err) {
        throw new BadRequestException({
          message: 'Invalid file URL provided',
          details: url,
          code: 'INVALID_URL',
        });
      }
    });

    const bodyData = filePaths.join('\n');
    const bulkDeleteUrl = `${this.BASE_URL}?bulk-delete`;

    try {
      const response = await axios.post(bulkDeleteUrl, bodyData, {
        headers: {
          'X-Auth-Token': authToken,
          'Content-Type': 'text/plain',
        },
      });

      if (response.status !== 200) {
        throw new BadRequestException({
          message: 'Failed to delete files from storage',
          response: response.data,
          code: 'DELETE_FAILED',
        });
      }

      return {
        message: 'Files deleted successfully',
        deleted: filePaths,
      };
    } catch (error) {
      throw new BadRequestException({
        message: 'File deletion failed',
        details: error.response?.data || error.message,
        code: 'DELETE_ERROR',
      });
    }
  }
}
