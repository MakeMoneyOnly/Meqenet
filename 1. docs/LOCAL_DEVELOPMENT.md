# Meqenet 2.0 Local Development Guide

_For Personas: FinTech DevOps Engineer, Senior Backend Developer, Senior Mobile Developer_

This comprehensive guide will help you set up and run the Meqenet 2.0 BNPL platform locally for
development. It follows our established tech stack and microservices architecture principles.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Architecture Overview](#architecture-overview)
4. [Project Structure](#project-structure)
5. [Development Environment Setup](#development-environment-setup)
6. [Backend Development](#backend-development)
7. [Frontend Development](#frontend-development)
8. [Mobile Development](#mobile-development)
9. [Database Management](#database-management)
10. [API Development](#api-development)
11. [Testing](#testing)
12. [Security Considerations](#security-considerations)
13. [Performance and Debugging](#performance-and-debugging)
14. [Ethiopian Localization](#ethiopian-localization)
15. [Troubleshooting](#troubleshooting)

## 📋 Prerequisites

### Required Software

- **Node.js 18.19.0 (LTS)** - Our standard version per tech stack requirements
- **Docker and Docker Compose** - For database containers and service orchestration
- **Git** - Version control
- **Visual Studio Code** (recommended) - IDE with Ethiopian language support

### Platform-Specific Requirements

#### For Mobile Development (iOS)

- **macOS** with Xcode 14+
- **Cocoapods** for iOS dependency management
- **iOS Simulator** for testing

#### For Mobile Development (Android)

- **Java JDK 11** - Required for React Native
- **Android Studio** or Android SDK Command Line Tools
- **Android Emulator** or physical device for testing

#### For Full-Stack Development

- **PostgreSQL client tools** - For database interaction
- **Redis CLI** - For cache management
- **AWS CLI** - For cloud resource interaction (optional)

## 🚀 Quick Start: The Enterprise-Grade Standard

Our local development setup is designed to be **fully automated and containerized** to ensure
consistency and eliminate manual configuration. The entire environment is orchestrated using
**Docker Compose**.

### One-Command Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/meqenet/meqenet-platform.git
    cd meqenet-platform
    ```

2.  **Run the automated setup script:**
    ```bash
    ./scripts/dev-setup.sh
    ```

### What This Script Does

This single command automates the entire setup process by:

1.  **Validating Prerequisites:** Checks for Docker, Docker Compose, and Node.js.
2.  **Starting Containers:** Runs `docker-compose up -d` to launch the core infrastructure:
    - A **PostgreSQL** container for the primary database.
    - A **Redis** container for caching and session management.
    - The **`auth-service`** container itself.
    - Any other required backing services.
3.  **Installing Dependencies:** Runs `pnpm install` to fetch all project dependencies.
4.  **Database Seeding:** Automatically runs a seeding utility to populate the local PostgreSQL
    instance with a standard, anonymized set of test data. This includes:
    - Test users with different roles (e.g., `admin`, `user`, `merchant`).
    - Sample merchants and products.
    - Pre-defined KYC statuses.
5.  **Environment Configuration:** Copies the `.env.example` to `.env` for local use, pre-configured
    to connect to the Docker containers.

Your environment is now ready. You can access the services at their designated ports, and your
database is populated with consistent test data.

## 🏗️ Architecture Overview

Meqenet 2.0 follows a **microservices architecture** with **Feature-Sliced Design (FSD)** for code
organization:

### Microservices Structure

```
meqenet-platform/
├── apps/
│   ├── api-gateway/         # Central API Gateway (NestJS)
│   ├── auth-service/        # Authentication & Authorization
│   ├── payment-service/     # BNPL & Payment Processing
│   ├── user-service/        # User Management & KYC
│   ├── merchant-service/    # Merchant Onboarding & Management
│   ├── notification-service/# SMS, Email, Push Notifications
│   └── analytics-service/   # Business Intelligence & Reporting
├── libs/
│   ├── shared/             # Shared utilities and types
│   ├── database/           # Prisma schemas and utilities
│   ├── messaging/          # Event bus and messaging
│   └── security/           # Security utilities and middleware
├── web-apps/
│   ├── consumer-portal/    # Next.js consumer application
│   ├── merchant-portal/    # Next.js merchant dashboard
│   └── admin-portal/       # Next.js admin backoffice
├── mobile/
│   └── meqenet-app/        # React Native mobile application
```

### Feature-Sliced Architecture (FSD)

Within each application, we follow FSD principles:

```
app/
├── shared/          # Shared utilities, UI components, API clients
├── entities/        # Business entities (User, Payment, Merchant)
├── features/        # Business features (authentication, payments, etc.)
├── widgets/         # Complex UI components
├── pages/           # Application pages/screens
└── app/            # Application configuration and providers
```

## 📁 Project Structure

```
meqenet-platform/
├── apps/                   # Microservices and applications
├── libs/                   # Shared libraries
├── web-apps/              # Web applications
├── mobile/                # Mobile applications
├── infrastructure/        # Terraform and deployment configs
├── scripts/               # Development and deployment scripts
├── docs/                  # Project documentation
├── .github/               # GitHub Actions workflows
├── package.json           # Root package configuration
├── yarn.lock             # Dependency lock file
├── docker-compose.yml    # Local development services
└── README.md             # Project overview
```

## 🔧 Development Environment Setup

### 1. Node.js and Package Manager Setup

Using Node Version Manager (nvm):

```bash
# Install and use the correct Node.js version
nvm install 18.19.0
nvm use 18.19.0
nvm alias default 18.19.0

# Verify installation
node --version  # Should output v18.19.0
npm --version   # Should output 9.x.x
```

### 2. Install Global Development Tools

```bash
# Essential global packages
npm install -g \
  yarn \
  @nestjs/cli \
  @react-native-community/cli \
  expo-cli \
  typescript \
  ts-node \
  eslint \
  prettier
```

### 3. Docker Setup

Ensure Docker is running and create the development network:

```bash
# Verify Docker installation
docker --version
docker-compose --version

# Create development network
docker network create meqenet-dev
```

### 4. Environment Configuration

```bash
# Copy environment template
cp .env.local .env

# Edit environment variables
code .env
```

**Key environment variables to configure:**

```bash
# Database
DATABASE_URL="postgresql://meqenet:password@localhost:5432/meqenet_dev"
REDIS_URL="redis://localhost:6379"

# Ethiopian Services (Development/Staging endpoints)
FAYDA_API_URL="https://staging-api.fayda.gov.et"
FAYDA_API_KEY="your-development-api-key"

TELEBIRR_API_URL="https://sandbox.telebirr.et"
TELEBIRR_MERCHANT_ID="your-test-merchant-id"
TELEBIRR_API_KEY="your-development-api-key"

# Security
JWT_SECRET="your-super-secure-jwt-secret-for-development"
BCRYPT_ROUNDS="10"

# Application
NODE_ENV="development"
LOG_LEVEL="debug"
```

## 🔧 Backend Development

### Starting Backend Services

1. **Start databases:**

   ```bash
   ./scripts/setup-database.sh
   ```

2. **Start API Gateway:**

   ```bash
   cd apps/api-gateway
   yarn dev
   ```

3. **Start individual microservices:**

   ```bash
   # Authentication service
   cd apps/auth-service
   yarn dev

   # Payment service
   cd apps/payment-service
   yarn dev

   # User service
   cd apps/user-service
   yarn dev
   ```

### Database Operations

```bash
# Generate Prisma client
yarn prisma:generate

# Run database migrations
yarn prisma:migrate:dev

# Seed database with test data
yarn prisma:seed

# Open Prisma Studio (database GUI)
yarn prisma:studio
```

### API Development Workflow

1. **Update OpenAPI specification** (`openapi.yaml`)
2. **Generate API types:**
   ```bash
   yarn api:generate-types
   ```
3. **Implement endpoints** following NestJS patterns
4. **Write tests:**
   ```bash
   yarn test
   yarn test:e2e
   ```

### gRPC Communication (Internal Services)

```bash
# Generate gRPC types from .proto files
yarn grpc:generate

# Test gRPC services
yarn grpc:test
```

## 🌐 Frontend Development

### Web Applications (Next.js)

#### Consumer Portal

```bash
cd web-apps/consumer-portal
yarn dev
```

- Access at: `http://localhost:3000`
- Features: Shopping, BNPL checkout, account management
- Supports: Amharic and English

#### Merchant Portal

```bash
cd web-apps/merchant-portal
yarn dev
```

- Access at: `http://localhost:3001`
- Features: Sales analytics, settlement management, API integration

#### Admin Portal

```bash
cd web-apps/admin-portal
yarn dev
```

- Access at: `http://localhost:3002`
- Features: User management, merchant approval, system monitoring

### Component Development

#### Using Storybook

```bash
# Start Storybook for component development
cd web-apps/consumer-portal
yarn storybook
```

#### Creating New Components

```bash
# Generate new component
yarn generate:component ButtonPrimary

# Generate new feature
yarn generate:feature PaymentPlan
```

## 📱 Mobile Development

### React Native Setup

1. **Start Metro bundler:**

   ```bash
   cd mobile/meqenet-app
   yarn start
   ```

2. **Run on iOS simulator:**

   ```bash
   yarn ios
   ```

3. **Run on Android emulator:**
   ```bash
   yarn android
   ```

### Mobile-Specific Configuration

#### iOS Development

```bash
# Install iOS dependencies
cd ios && pod install && cd ..

# Open in Xcode for debugging
open ios/MeqenetApp.xcworkspace
```

#### Android Development

```bash
# Build Android app
yarn android:build

# Generate signed APK
yarn android:build:release
```

### Mobile Testing

```bash
# Run unit tests
yarn test

# Run E2E tests with Detox
yarn test:e2e:ios
yarn test:e2e:android
```

## 🗄️ Database Management

### Local Database Containers

Check database status:

```bash
./scripts/setup-database.sh --status
```

### Database Operations

#### PostgreSQL Operations

```bash
# Connect to PostgreSQL
psql postgresql://meqenet:password@localhost:5432/meqenet_dev

# Backup database
pg_dump postgresql://meqenet:password@localhost:5432/meqenet_dev > backup.sql

# Restore database
psql postgresql://meqenet:password@localhost:5432/meqenet_dev < backup.sql
```

#### Redis Operations

```bash
# Connect to Redis
redis-cli -p 6379

# Check Redis info
redis-cli info

# Clear Redis cache
redis-cli flushall
```

### Database Schema Management

```bash
# Create new migration
yarn prisma:migrate:dev --name add_payment_plans

# Reset database
yarn prisma:migrate:reset

# View migration status
yarn prisma:migrate:status
```

## 🔌 API Development

### OpenAPI Specification

1. **Edit API specification:**

   ```bash
   code openapi.yaml
   ```

2. **Validate specification:**

   ```bash
   yarn api:validate
   ```

3. **Generate documentation:**

   ```bash
   yarn api:docs:generate
   ```

4. **View API documentation:**
   - Local: `http://localhost:3000/api/docs`
   - Or: `yarn api:docs:serve`

### Testing APIs

#### Using Postman

```bash
# Import Postman collection
# File: docs/api/Meqenet-API.postman_collection.json
```

#### Using curl

```bash
# Register new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "phone": "+251911123456",
    "fayda_id": "ET1234567890"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Run specific test file
yarn test auth.service.spec.ts
```

### Integration Tests

```bash
# Run integration tests
yarn test:integration

# Run E2E tests
yarn test:e2e
```

### Mobile Testing

```bash
# iOS E2E tests
yarn test:e2e:ios

# Android E2E tests
yarn test:e2e:android

# Test on specific device
yarn test:e2e:ios --device "iPhone 14"
```

### Load Testing

```bash
# Run K6 performance tests
yarn test:load

# Test specific endpoint
k6 run tests/load/auth-load-test.js
```

## 🔒 Security Considerations

### Local Development Security

1. **Environment Variables:**
   - Never commit real secrets to version control
   - Use `.env.local` template for local development
   - Rotate development API keys regularly

2. **Database Security:**
   - Use strong passwords even in development
   - Limit database access to localhost
   - Regularly update database containers

3. **API Security:**
   - Always use HTTPS in staging/production
   - Implement rate limiting in development
   - Test authentication flows thoroughly

### Security Testing

```bash
# Run security linting
yarn lint:security

# Check for vulnerable dependencies
yarn audit

# Run OWASP ZAP security scan (if configured)
yarn security:scan
```

## 🚀 Performance and Debugging

### Performance Monitoring

#### Backend Performance

```bash
# Start with profiling
yarn dev:profile

# Monitor API performance
yarn monitor:api
```

#### Frontend Performance

```bash
# Analyze bundle size
yarn analyze

# Run Lighthouse audit
yarn audit:lighthouse
```

### Debugging

#### Backend Debugging

```bash
# Start in debug mode
yarn dev:debug

# Attach VS Code debugger to port 9229
```

#### Frontend Debugging

- Use Chrome DevTools
- React Developer Tools
- Redux DevTools (if using Redux)

#### Mobile Debugging

```bash
# Start React Native debugger
yarn debug:mobile

# Enable Flipper debugging
yarn flipper
```

### Logging and Monitoring

```bash
# View application logs
yarn logs

# View specific service logs
yarn logs:auth-service

# Monitor system metrics
yarn monitor
```

## 🇪🇹 Ethiopian Localization

### Language Support

#### Setting Up Amharic

1. **Install Amharic fonts** on your development machine
2. **Configure VS Code** for Amharic input:
   ```json
   // settings.json
   {
     "editor.fontFamily": "Noto Sans Ethiopic, Consolas, monospace",
     "files.encoding": "utf8"
   }
   ```

#### Working with Translations

```bash
# Extract translation keys
yarn i18n:extract

# Validate translations
yarn i18n:validate

# Generate missing translations
yarn i18n:missing
```

### Ethiopian Calendar Integration

```javascript
// Example: Working with Ethiopian dates
import { EthiopianCalendar } from '@/libs/shared/ethiopian-calendar';

const ethiopianDate = EthiopianCalendar.fromGregorian(new Date());
console.log(ethiopianDate.format('YYYY/MM/DD')); // 2016/05/15 (Ethiopian)
```

### Cultural Considerations

1. **Colors and Imagery:**
   - Use Ethiopian flag colors (green, yellow, red)
   - Include culturally relevant imagery
   - Respect religious and cultural sensitivities

2. **Currency and Numbers:**
   - Display amounts in Ethiopian Birr (ETB)
   - Use Ethiopian number formatting
   - Support both Ethiopian and Gregorian calendars

3. **Holidays and Festivals:**
   - Implement Ethiopian holiday calendar
   - Show special promotions during Timkat, Meskel, etc.
   - Respect fasting periods in UX design

## 🔧 Troubleshooting

### Common Issues

#### Node.js Version Issues

```bash
# Check current version
node --version

# Switch to correct version
nvm use 18.19.0

# Set as default
nvm alias default 18.19.0
```

#### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or find and kill manually
lsof -ti:3000 | xargs kill -9
```

#### Database Connection Issues

```bash
# Check database status
./scripts/setup-database.sh --status

# Restart databases
./scripts/setup-database.sh --reset

# Check Docker containers
docker ps -a
```

#### Package Installation Issues

```bash
# Clear npm/yarn cache
npm cache clean --force
yarn cache clean

# Delete node_modules and reinstall
rm -rf node_modules yarn.lock
yarn install
```

#### Mobile Development Issues

**iOS Issues:**

```bash
# Clean iOS build
cd ios
rm -rf build
xcodebuild clean
cd .. && yarn ios
```

**Android Issues:**

```bash
# Clean Android build
cd android
./gradlew clean
cd .. && yarn android
```

### Performance Issues

#### Slow Database Queries

```bash
# Analyze slow queries
yarn db:analyze-slow-queries

# Optimize database
yarn db:optimize
```

#### Large Bundle Sizes

```bash
# Analyze bundle
yarn analyze

# Find large dependencies
yarn deps:analyze
```

### Getting Help

1. **Check Documentation:**
   - [Architecture Documentation](./docs/Stage%201%20-%20Foundation/08-Architecture.md)
   - [API Documentation](./docs/Stage%202%20-Development/19-API_Documentation_Strategy.md)
   - [Security Guidelines](./docs/Stage%201%20-%20Foundation/07-Security.md)

2. **Development Team Resources:**
   - Team Slack channels
   - Weekly development sync meetings
   - Architecture review sessions

3. **External Resources:**
   - [NestJS Documentation](https://docs.nestjs.com/)
   - [Next.js Documentation](https://nextjs.org/docs)
   - [React Native Documentation](https://reactnative.dev/docs/getting-started)
   - [Ethiopian Developer Community](https://ethiopiandev.com/)

## 📚 Additional Resources

### Ethiopian Development Guidelines

- [Ethiopian Software Development Best Practices](./ETHIOPIAN_DEVELOPMENT.md)
- [NBE Compliance Guidelines](./docs/Stage%201%20-%20Foundation/05-Compliance_Framework.md)
- [Fayda ID Integration Guide](./docs/Stage%201%20-%20Foundation/11-Integration_Requirements.md)

### Development Workflow

- [Git Workflow](./docs/GIT_BRANCH_PROTECTION_SETUP.md)
- [Code Review Guidelines](./docs/Stage%202%20-Development/21-Code_Review.md)
- [Testing Guidelines](./docs/Stage%202%20-Development/22-Testing_Guidelines.md)

### Deployment and Operations

- [Deployment Guide](./docs/Stage%203%20-%20Deployment%20&%20Operations/23-Deployment.md)
- [Infrastructure Setup](./docs/Stage%203%20-%20Deployment%20&%20Operations/24-Infrastructure.md)
- [Monitoring and Logging](./docs/Stage%203%20-%20Deployment%20&%20Operations/25-Monitoring_And_Logging.md)

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained by:** FinTech DevOps Engineer, Senior Backend Developer, Senior Mobile Developer  
**Next Review:** February 2025

---

_This guide is part of the Meqenet 2.0 development documentation. For technical implementation
details, see the Architecture, Tech Stack, and Security documentation in the Foundation stage._
