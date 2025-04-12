# Project Structure

```src
src/
├── main.ts                  # Application bootstrap file
├── app/                     # Core application components
│   ├── app.base.controller.ts  # Base controller with shared functionality
│   ├── app.service.ts         # Core application service
│   ├── app.module.ts          # Root application module
│   └── app.constant.ts        # Application-wide constants
├── configs/                 # Configuration files
│   ├── index.ts            # Configuration exports and namespaces
│   ├── app.ts              # Application configuration
│   └── database.ts         # Database configuration
├── common/                  # Shared components
│   ├── decorators/         # Custom decorators
│   │   └── roles.decorator.ts  # Role-based decorators
│   ├── enums/              # Shared enumerations
│   │   └── role.enum.ts    # User role definitions
│   ├── filters/            # Exception filters
│   └── guards/             # Authentication & authorization guards
│       └── jwt-auth.guard.ts  # JWT authentication guard
├── database/               # Database related files
│   ├── collections.ts      # Collection name constants
│   └── database.module.ts  # Database module configuration
├── entities/               # MongoDB schemas/entities
│   ├── base.entity.ts      # Base entity with common fields
│   ├── user.entity.ts      # User schema definition
│   ├── service.entity.ts   # Service schema definition
│   ├── category.entity.ts  # Category schema definition
│   ├── seo.entity.ts       # SEO settings schema
│   └── system-log.entity.ts # System logging schema
├── logger/                 # Logging configuration
│   └── logger.ts           # Winston logger setup
├── middleware/             # Custom middleware
│   ├── api-key.middleware.ts    # API key validation
│   ├── checksum.middleware.ts   # Request checksum validation
│   ├── cors.middleware.ts       # CORS configuration
│   ├── csrf.middleware.ts       # CSRF protection
│   ├── jwt-cookie.middleware.ts # JWT cookie handling
│   ├── multer.middleware.ts     # File upload handling
│   └── request-logger.middleware.ts # Request logging
├── modules/                # Feature modules
│   ├── auth/              # Authentication module
│   │   ├── dto/          # Data transfer objects
│   │   ├── guards/       # Authentication guards
│   │   ├── strategies/   # Authentication strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.public.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── cache/            # Caching module
│   │   └── redis-cache.module.ts
│   ├── category/         # Category management
│   │   ├── dto/
│   │   ├── responses/
│   │   ├── category.controller.ts
│   │   └── category.service.ts
│   ├── contact/          # Contact management
│   │   ├── contact.controller.ts
│   │   └── contact.service.ts
│   ├── faq/             # FAQ management
│   │   ├── faq.controller.ts
│   │   └── faq.service.ts
│   ├── seo/             # SEO management
│   │   ├── dto/
│   │   ├── seo.controller.ts
│   │   ├── seo.service.ts
│   │   └── seo.module.ts
│   ├── service/         # Service management
│   │   ├── dto/
│   │   ├── service.controller.ts
│   │   └── service.service.ts
│   ├── slug/            # Slug generation
│   │   └── slug.provider.ts
│   ├── system-log/      # System logging
│   │   ├── system-log.controller.ts
│   │   ├── system-log.service.ts
│   │   ├── system-log.module.ts
│   │   └── system-log.interface.ts
│   └── user/            # User management
│       ├── dto/
│       ├── user.controller.ts
│       ├── user.service.ts
│       ├── user.module.ts
│       ├── user.schedule.ts
│       └── user.constant.ts
├── types/               # Type definitions
│   └── express.d.ts     # Express type extensions
└── utils/              # Utility functions
    ├── backup.util.ts  # Database backup utilities
    ├── multer-config.util.ts # File upload configuration
    └── time.ts        # Time-related utilities
```
