// src/common/hooks/upload.interceptor.ts
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from './multer-config.util';

export const SingleFileUpload = (fieldName: string) =>
  FileInterceptor(fieldName, multerConfig);

export const MultipleFileUpload = (fieldName: string, maxCount = 5) =>
  FilesInterceptor(fieldName, maxCount, multerConfig);
