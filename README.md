<div align="center">

# HUST4L Backend Service

## Project Overview

HUST4L Backend Service is designed to provide a scalable and secure backend system for managing content and users, specifically tailored for modern web applications. The service is built with NestJS, leveraging MongoDB for data storage and Redis for caching to ensure high performance and reliability.


A NestJS-based backend service providing REST APIs for content management and user authentication.

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

</div>

## Features

- User Authentication & Authorization
- Content Management (Blogs, FAQs, Services, Categories , Seo , Pricings, Contact)
- Redis Caching
- System Logging
- MongoDB Integration
- CSRF Protection
- Rate Limiting
- API Key Authentication

## Tech Stack

- NestJS
- MongoDB with Mongoose
- Redis
- TypeScript
- JWT Authentication

## Project Structure

```plaintext
src/
├── app/                  # App core modules
├── common/              # Shared decorators, guards, enums
├── configs/             # Configuration files
├── database/            # Database connection module
├── entities/            # MongoDB schemas/entities
├── middleware/          # Custom middleware
├── modules/             # Feature modules
├── services/            # Shared services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Prerequisites

- Node.js (v16+)
- MongoDB
- Redis
- Windows/Linux/MacOS

## Environment Variables

Create a `.env` file in the root directory and set the following variables:

```env
# App settings
PORT=8080                # The port where the app will run
NODE_ENV=development     # Set the environment to development, production, etc.

# Database settings
MONGODB_URI=mongodb://localhost:27017/hust4l  # MongoDB connection URI

# Redis settings
REDIS_HOST=localhost     # The address of the Redis server
REDIS_PORT=6379          # The port of the Redis server
REDIS_PASSWORD=          # Redis password, if applicable

# Security settings
JWT_SECRET=your_jwt_secret  # Secret key used for generating JWT tokens
API_KEY=your_api_key       # API key for secure access to the API
ALLOWED_ORIGINS=http://localhost:3000  # Allowed origins for CORS
```

## Installation

```bash
yarn install
```

## Running the app

```bash
# development
nest start

# watch mode
nest start --watch

# production mode
nest build
```

## API Documentation

You can find the full API documentation [here](docs/HUST4L_API_Documentation.md).



## Security Features

- CSRF Protection
- Rate Limiting
- API Key Authentication
- JWT Authentication
- Role-based Access Control

## Caching

The application uses Redis for caching with a default TTL of 24 hours. Cache keys are automatically managed for:

- Categories
- Blogs
- Services
- FAQs
- Seo
- Pricings
- Contact
- User data

## Error Handling

Standard HTTP status codes are used:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Server Error

## Monitoring

Health checks are available at:

- GET `/health` - System health status

## License

[MIT Licensed](LICENSE)

```markdown
## Contributing

We welcome contributions! To contribute to this project, please fork the repository and create a pull request with your changes.

### How to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix (`git checkout -b feature-name`).
3. Commit your changes (`git commit -am 'Add feature'`).
4. Push your changes to your fork (`git push origin feature-name`).
5. Create a pull request.

### Reporting Issues

If you encounter any issues, feel free to open a new issue in the repository. Provide as much information as possible, including steps to reproduce and error messages.
