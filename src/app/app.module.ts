import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppBaseController } from './app.base.controller';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../modules/auth/guards/RolesGuard';
import { CorsMiddleware } from '../middleware/cors.middleware';
import { ScheduleModule } from '@nestjs/schedule';

import { CsrfMiddleware } from '../middleware/csrf.middleware';
import { RateLimitMiddleware } from '../middleware/rate-limiter.middleware';
import { RequestLoggerMiddleware } from '../middleware/request-logger.middleware';
import { JwtCookieMiddleware } from '../middleware/jwt-cookie.middleware';
import { ApiKeyMiddleware } from '../middleware/api-key.middleware';
import { ChecksumMiddleware } from '../middleware/checksum.middleware';

import { DatabaseModule } from '../database/database.module';

import { UserModule } from '../modules/user/user.module';
import { AuthModule } from '../modules/auth/auth.module';
import { AppService } from './app.service';
import { HealthModule } from '../modules/health/health.module';
import { FaqModule } from '../modules/faq/faq.module';
import { CategoryModule } from '../modules/category/category.module';
import { ContactModule } from '../modules/contact/contact.module';
import { BlogModule } from '../modules/blog/blog.module';
import { ServiceModule } from '../modules/service/service.module';
import { RedisCacheModule } from '../modules/cache/redis-cache.module';
import { BackupModule } from '../modules/backup/backup.module';
import { PricingModule } from '../modules/pricing/pricing.module';
import { SeoModule } from 'src/modules/seo/seo.module';
import { ProjectModule } from 'src/modules/project/project.module';
import { MediaModule } from 'src/modules/media/media.module';
import { TrackingModule } from 'src/modules/tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    RedisCacheModule,
    SeoModule,
    AuthModule,
    ScheduleModule.forRoot(),
    BackupModule,
    UserModule,
    HealthModule,
    FaqModule,
    CategoryModule,
    BlogModule,
    ServiceModule,
    ProjectModule,
    ContactModule,
    PricingModule,
    MediaModule,
    TrackingModule,
  ],
  controllers: [AppBaseController],
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

    consumer.apply(CorsMiddleware).forRoutes('*');

    // API Key middleware
    consumer
      .apply(ApiKeyMiddleware)

      .forRoutes('*');

    // CSRF middleware - Apply to all routes
    consumer
      .apply(CsrfMiddleware)
      .exclude({
        path: '/public/auth/login',
        method: RequestMethod.POST,
      })
      .forRoutes('*');

    consumer.apply(RateLimitMiddleware).forRoutes('*');

    // consumer.apply(ChecksumMiddleware).forRoutes('public/auth/login');

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
          path: '/category/:slug',
          method: RequestMethod.GET,
        },
        {
          path: '/blog',
          method: RequestMethod.GET,
        },
        {
          path: '/blog/:slug',
          method: RequestMethod.GET,
        },
        {
          path: '/faqs',
          method: RequestMethod.GET,
        },
        {
          path: '/pricing',
          method: RequestMethod.GET,
        },
        {
          path: '/pricing/:slug',
          method: RequestMethod.GET,
        },
        {
          path: '/service',
          method: RequestMethod.GET,
        },
        {
          path: '/service/:slug',
          method: RequestMethod.GET,
        },
        {
          path: '/project',
          method: RequestMethod.GET,
        },
        {
          path: '/project/:slug',
          method: RequestMethod.GET,
        },
        {
          path: '/tracking/track',
          method: RequestMethod.POST,
        }
      )
      .forRoutes('*');
  }
}
