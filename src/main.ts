import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { AppConfigType } from './configs/app';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
// Change the import style for cookie-parser
const cookieParser = require('cookie-parser');

async function hust4l() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get<ConfigService<AppConfigType>>(ConfigService);
  const port = configService.get<number>('port') || 8080;

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Important for data transformation
    })
  );

  await app.listen(port);
  console.log(`🚀 HUST4L đang chạy tại: http://localhost:${port}`);
}

hust4l();
