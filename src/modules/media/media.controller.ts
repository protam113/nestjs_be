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
}
