import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { AppConfigType } from './configs/app';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function hust4l() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get<ConfigService<AppConfigType>>(ConfigService);
  const port = configService.get<number>('port') || 8080;

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 👈 cái này quan trọng
    })
  );

  await app.listen(port);
  console.log(`🚀 HUST4L đang chạy tại: http://localhost:${port}`);
}

hust4l();
