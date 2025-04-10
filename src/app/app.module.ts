import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppBaseController } from './app.base.controller';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/modules/auth/guards/RolesGuard';

import { CsrfMiddleware } from '../middleware/csrf.middleware';
import { RateLimitMiddleware } from '../middleware/rate-limiter.middleware';
import { RequestLoggerMiddleware } from '../middleware/request-logger.middleware';
import { JwtCookieMiddleware } from '../middleware/jwt-cookie.middleware';
import { ApiKeyMiddleware } from '../middleware/api-key.middleware';

import { DatabaseModule } from '../database/database.module';

import { UserModule } from '../modules/user/user.module';
import { AuthModule } from '../modules/auth/auth.module';
import { AppService } from './app.service';
import { HealthModule } from '../modules/health/health.module';
import { FaqModule } from 'src/modules/faq/faq.module';
import { CategoryModule } from 'src/modules/category/category.module';
import { ContactModule } from 'src/modules/contact/contact.module';
import { BlogModule } from 'src/modules/blog/blog.module';
import { ServiceModule } from 'src/modules/service/service.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UserModule,
    HealthModule,
    FaqModule,
    CategoryModule,
    BlogModule,
    ServiceModule,
    ContactModule,
  ],
  controllers: [AppBaseController], // bỏ HealthController khỏi đây
  providers: [
    {
      provide: 'app',
      useClass: AppService,
    },
    ApiKeyMiddleware,
    CsrfMiddleware,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Request logger middleware
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');

    // API Key middleware
    consumer.apply(ApiKeyMiddleware).forRoutes('*');

    // CSRF middleware - Apply to all routes
    consumer.apply(CsrfMiddleware).forRoutes('*');

    consumer.apply(RateLimitMiddleware).forRoutes('*');

    // JWT Cookie middleware
    consumer
      .apply(JwtCookieMiddleware)
      .exclude(
        '/public/auth/login',
        {
          path: '/health',
          method: RequestMethod.GET,
        },
        {
          path: '/contact',
          method: RequestMethod.POST,
        },
        {
          path: '/category',
          method: RequestMethod.GET,
        },
        {
          path: '/blog',
          method: RequestMethod.GET,
        },
        {
          path: '/service',
          method: RequestMethod.GET,
        },
        {
          path: '/blog/:slug',
          method: RequestMethod.GET,
        }
      )
      .forRoutes('*');
  }
}
