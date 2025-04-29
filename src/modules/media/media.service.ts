import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from 'src/utils/cache-key.util';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly AUTH_URL: string;
  private readonly BASE_URL: string;
  private readonly SWIFT_USERNAME: string;
  private readonly SWIFT_PASSWORD: string;
  private readonly PROJECT_ID: string;

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
    const cacheKey = buildCacheKey('XAuthToken', {});
    this.logger.log('Cache key:', cacheKey);

    let token = (await this.cacheService.get(cacheKey)) as string | undefined;

    if (!token) {
      this.logger.warn('Token not found in cache, fetching from API...');

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
        const response = await fetch(this.AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(authPayload),
        });

        if (!response.ok) {
          const errorData = await response.text(); // text() vì có thể nhận HTML
          this.logger.error('Error response from API:', errorData);
          throw new Error('Failed to fetch token from API');
        }

        token = response.headers.get('x-subject-token') || '';

        if (token) {
          await this.cacheService.set(cacheKey, token, 3600);
          this.logger.log('New token fetched and cached successfully.');
        } else {
          this.logger.error('Token not found in response headers.');
          throw new Error('Token not found in response headers.');
        }
      } catch (error) {
        this.logger.error('Fetch error:', (error as Error).message);
        throw new Error(
          'Error fetching token from VStorage: ' + (error as Error).message
        );
      }
    } else {
      this.logger.log('Cache hit for token');
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

    const cacheKeyPattern = buildCacheKey('XAuthToken', {}); // chuẩn bị cache pattern

    let authToken = await this.getAuthToken();
    const sanitizedPath = folderPath.replace(/^\/+|\/+$/g, '');
    const uploadPath = `${this.BASE_URL}${sanitizedPath}/${file.originalname}`;

    const attemptUpload = async (token: string) => {
      const response = await fetch(uploadPath, {
        method: 'PUT',
        headers: {
          'X-Auth-Token': token,
          'Content-Type': file.mimetype,
        },
        body: file.buffer,
      });

      return response;
    };

    try {
      let response = await attemptUpload(authToken);

      if (response.status === 401) {
        this.logger.warn(
          'Token expired. Deleting cache and retrying with new token.'
        );

        await this.cacheService.delByPattern(`${cacheKeyPattern}*`); // xóa mọi biến thể token
        authToken = await this.getAuthToken(); // lấy token mới
        response = await attemptUpload(authToken); // retry lần 2
      }

      if (!response.ok) {
        const errorData = await response.text();
        this.logger.error('Error uploading file:', errorData);
        throw new BadRequestException({
          message: 'Failed to upload file to storage',
          code: 'UPLOAD_FAILED',
        });
      }

      return { url: uploadPath };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
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
    const containerName = this.getRequiredConfig('CONTAINER_NAME'); // ex: 'cdn'

    console.log('Received file URLs:', fileUrls);

    const filePaths = fileUrls.map((url) => {
      try {
        const fullPath = url.startsWith('http') ? new URL(url).pathname : url;
        const normalized = fullPath.replace(/^\/+/, ''); // xóa leading slash nếu có

        // Đảm bảo luôn giữ lại container name ở đầu (ví dụ: "cdn/...")
        if (!normalized.startsWith(`${containerName}/`)) {
          throw new BadRequestException({
            message: `File path must start with container name "${containerName}"`,
            details: url,
            code: 'INVALID_PATH',
          });
        }

        return normalized;
      } catch {
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
      console.log('📤 Sending DELETE request to CDN:');
      console.log('➡️ URL:', bulkDeleteUrl);
      console.log('🧾 Body:', bodyData);
      console.log('🪪 Headers:', {
        'X-Auth-Token': authToken,
        'Content-Type': 'text/plain',
      });

      const response = await fetch(bulkDeleteUrl, {
        method: 'POST',
        headers: {
          'X-Auth-Token': authToken,
          'Content-Type': 'text/plain',
        },
        body: bodyData, // Body chứa dữ liệu file cần xóa
      });

      if (!response.ok) {
        const errorData = await response.text();
        this.logger.error('Error deleting files:', errorData);
        throw new BadRequestException({
          message: 'Failed to delete files from storage',
          response: errorData,
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
        details: error.message,
        code: 'DELETE_ERROR',
      });
    }
  }
}
