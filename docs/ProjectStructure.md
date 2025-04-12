# Project Structure

```src
src/
├── main.ts                  # Application bootstrap file
├── app/                     # Core application components
│   ├── app.base.controller.ts  # Base controller with shared functionality
│   ├── app.service.ts
│   ├── app.module.ts
│   └── app.constant.ts      # Application-wide constants
├── configs/                 # Configuration files
│   ├── index.ts            # Config exports
│   ├── app.ts              # App configuration
│   └── database.ts         # Database configuration
├── common/                  # Shared components
│   ├── decorators/         # Custom decorators
│   │   └── roles.decorator.ts
│   ├── enums/              # Shared enumerations
│   │   └── role.enum.ts    # User role definitions
│   ├── filters/            # Exception filters
│   └── guards/             # Authentication & authorization guards
│       └── jwt-auth.guard.ts
├── database/               # Database related files
│   └── database.module.ts
├── entities/               # MongoDB schemas/entities
│   ├── base.entity.ts      # Base entity with common fields
│   ├── user.entity.ts      # User schema with password hashing
│   └── system-log.entity.ts # System logging schema
├── middleware/             # Custom middleware
│   ├── api-key.middleware.ts
│   ├── jwt-cookie.middleware.ts
│   └── request-logger.middleware.ts
├── modules/                # Feature modules
│   ├── auth/              # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.public.controller.ts  # Public auth endpoints
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── strategies/    # Authentication strategies
│   │   │   └── secret.strategy.ts
│   │   └── guards/
│   │       └── roles.guard.ts
│   ├── category/          # Category management
│   │   ├── category.controller.ts
│   │   └── category.service.ts
│   ├── contact/           # Contact management
│   │   ├── contact.controller.ts
│   │   └── contact.service.ts
│   ├── faq/              # FAQ management
│   │   ├── faq.controller.ts
│   │   └── faq.service.ts
│   ├── slug/             # Slug generation
│   │   └── slug.provider.ts
│   ├── system-log/        # System logging module
│   │   ├── system-log.service.ts
│   │   └── system-log.interface.ts
│   └── user/              # User management module
│       ├── dto/
│       │   └── create-manager.dto.ts
│       ├── user.controller.ts
│       ├── user.service.ts
│       ├── user.module.ts
│       ├── user.schedule.ts  # Scheduled tasks
│       └── user.constant.ts
├── types/                 # Type definitions
│   └── express.d.ts       # Express type extensions
└── utils/                 # Utility functions and constants
    └── time.ts           # Time-related utilities
```
