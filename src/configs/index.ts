import { appConfig } from './app';
import { databaseConfig } from './Database';
import { ConfigFactory } from '@nestjs/config';

export enum ConfigNamespace {
  App = 'app',
  Database = 'database',
}

export const AppConfig = appConfig;
export const DatabaseConfig = databaseConfig;

export type { AppConfigType } from './app';
export type { DatabaseConfigType } from './Database';

// 👇 chuẩn config để NestJS load
const configs = (): ConfigFactory[] => [appConfig, databaseConfig];
export default configs;
