import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { Express } from 'express';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('path') path: string
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!path) {
      throw new BadRequestException('Missing "path" in body');
    }

    const uploadedUrl = await this.mediaService.uploadFile(path, file);
    return {
      message: 'Upload successful',
      url: uploadedUrl,
    };
  }

  @Post('delete')
  async deleteFiles(@Body('files') files: string[]) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new BadRequestException({
        message: 'files must be a non-empty array of URLs or relative paths',
        code: 'INVALID_INPUT',
      });
    }

    // Check nếu là URL thì extract path
    const filePaths = files.map((item) => {
      try {
        const url = new URL(item);
        const parts = url.pathname.split('/');
        const containerIndex = parts.findIndex((p) => p === 'v1') + 2;
        return parts.slice(containerIndex).join('/');
      } catch {
        return item; // nếu không phải URL thì coi là relative path luôn
      }
    });

    await this.mediaService.deleteFiles(filePaths);

    return {
      message: 'Files deleted successfully',
      deleted: filePaths,
    };
  }
}
