export const appConfig = () => ({
  name: process.env.APP_NAME || 'MyApp',
  host: process.env.APP_HOST || 'localhost',
  port: parseInt(process.env.APP_PORT || '8080'),
  secret: process.env.APP_SECRET || 'secret',
  jwt: {
    secret: process.env.JWT_SECRET || 'jwtsecret',
    signOptions: {
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600'),
    },
  },
});
appConfig.KEY = 'app'; // 👈 Bắt buộc gán KEY

export type AppConfigType = ReturnType<typeof appConfig>;
