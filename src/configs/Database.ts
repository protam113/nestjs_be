export const databaseConfig = () => ({
  url: process.env.DATABASE_URL || '', // Changed from mongoConnectionString
});
databaseConfig.KEY = 'database';

export type DatabaseConfigType = ReturnType<typeof databaseConfig>;
