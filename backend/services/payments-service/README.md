# payments-service

Core service for processing all Meqenet payment options, managing installment schedules, and handling financial settlements.

## 🏗️ Architecture

This microservice follows the **Feature-Sliced Design (FSD)** architecture pattern and is built
with:

- **Framework**: NestJS ^10.0.0
- **Runtime**: Node.js 18.19.0
- **Language**: TypeScript - **Database**: PostgreSQL with Prisma ORM - **Communication**: gRPC + REST API - **Messaging**: Event-driven architecture with AWS SNS/SQS ## 📁 Project Structure

```
src/
├── app/                 # Application configuration
├── features/            # Feature modules (business logic)
│   ├── auth/           # Authentication feature
│   └── shared/         # Shared feature utilities
├── shared/             # Shared utilities and components
│   ├── config/         # Configuration files
│   ├── guards/         # NestJS guards
│   ├── interceptors/   # NestJS interceptors
│   ├── filters/        # Exception filters
│   └── utils/          # Utility functions
├── infrastructure/     # External service integrations
│   ├── database/       # Database configuration
│   ├── messaging/      # Message broker setup
│   └── external-services/ # Third-party integrations
└── main.ts            # Application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.19.0
- Docker and Docker Compose
- Yarn package manager - PostgreSQL (via Docker) ### Installation

1. **Clone and install dependencies**
   ```bash
   cd payments-service
   yarn install
   ```

2. **Set up database**

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Generate Prisma client
yarn db:generate

# Run migrations
yarn db:migrate

# Seed initial data
yarn db:seed
```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the service**

   ```bash
   # Development mode
   yarn start:dev

   # Production mode
   yarn build
   yarn start:prod
   ```

## 🔧 Configuration

### Environment Variables

| Variable     | Description        | Default                       |
| ------------ | ------------------ | ----------------------------- |
| `PORT`       | Service port       | 3004 |
| `NODE_ENV`   | Environment        | development                   |
| `JWT_SECRET` | JWT signing secret | Required                      |

| `DATABASE_URL` | PostgreSQL connection string |
Required | | `GRPC_URL` | gRPC server URL
| localhost:5000 | | `LOG_LEVEL` | Logging level | info |

## 📚 API Documentation

When running in development mode, API documentation is available at:

- **Swagger UI**: http://localhost:3004/api/docs
- **Health Check**: http://localhost:3004/health
- **Metrics**: http://localhost:3004/metrics

## 🧪 Testing

```bash
# Unit tests
yarn test

# Integration tests
yarn test:integration

# End-to-end tests
yarn test:e2e

# Test coverage
yarn test:cov

# Watch mode
yarn test:watch
```

## 📊 Monitoring & Observability

This service includes built-in observability features:

- **Metrics**: Prometheus metrics exposed at `/metrics`
- **Health Checks**: Terminus health checks at `/health`
- **Distributed Tracing**: OpenTelemetry integration
- **Structured Logging**: Winston with correlation IDs

### Metrics Available

- HTTP request duration and count
- Database query performance
- Custom business metrics
- Node.js runtime metrics

## 🔒 Security Features

- **Helmet**: Security headers
- **Rate Limiting**: ThrottlerGuard
- **JWT Authentication**: Passport JWT strategy
- **Input Validation**: Class-validator with DTOs
- **CORS**: Configurable origins
- **Content Security Policy**: XSS protection

## 🌐 Internationalization

This service supports multiple languages:

- English (en) - Default
- Amharic (am) - Ethiopian localization

Language can be set via:

- Query parameter: `?lang=am`
- Accept-Language header

## 📦 Docker

### Build and Run

```bash
# Build image
yarn docker:build

# Run container
yarn docker:run

# Or use Docker Compose
docker-compose up payments-service
```

### Production Deployment

```bash
# Multi-stage build for production
docker build --target production -t payments-service:latest .
```

## 🔄 CI/CD

This service includes GitHub Actions workflows for:

- **Continuous Integration**: Lint, test, security scans
- **Dependency Scanning**: Automated vulnerability checks
- **Docker Image Building**: Multi-arch container builds
- **Deployment**: Automated deployment to staging/production

## 📝 Development Guidelines

### Adding New Features

1. Create feature module in `src/features/`
2. Follow Feature-Sliced Design principles
3. Add comprehensive tests
4. Update API documentation
5. Add i18n translations

### Code Style

- Use ESLint and Prettier for formatting
- Follow NestJS naming conventions
- Write JSDoc comments for public APIs
- Maintain 80%+ test coverage

### Security Considerations

- Validate all inputs with DTOs
- Use parameterized queries
- Implement proper error handling
- Log security-relevant events
- Follow OWASP guidelines

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and add tests
3. Run linting: `yarn lint`
4. Run tests: `yarn test`
5. Commit with conventional commits format
6. Create pull request

## 📞 Support

For support and questions:

- **Email**: development-team@meqenet.et[D[D[D[D[D[D[D[D[D[D[D[D[D[D[D[D[D[D[D[D[D[D[D[D[D[D[D[D[D[C
- **Documentation**: [Meqenet Developer Docs](https://docs.meqenet.et)
- **Slack**: #engineering channel

## 📄 License

This project is licensed under UNLICENSED - see the LICENSE file for details.

---

**Generated with Meqenet Microservice Template**  
_Built for Ethiopian FinTech Excellence_ 🇪🇹
