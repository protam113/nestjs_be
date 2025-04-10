// logger/logger.ts
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

// Tạo thư mục log nếu chưa có
const logDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logFormat = format.printf(({ timestamp, level, message }) => {
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
});

export const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), logFormat),
  transports: [
    new transports.Console(),
    new transports.DailyRotateFile({
      filename: path.join(logDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d', // giữ log 14 ngày
      zippedArchive: true,
    }),
  ],
});
