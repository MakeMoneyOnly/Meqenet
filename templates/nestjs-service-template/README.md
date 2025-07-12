# 🍪 NestJS Service Template

This is a standardized template for creating new NestJS microservices in the Meqenet monorepo.

## 🚀 Quick Start

### Using the Template

1. **Copy the template directory:**

   ```bash
   cp -r templates/nestjs-service-template backend/services/your-new-service
   ```

2. **Replace placeholders:** Replace the following placeholders in all files:
   - `{{SERVICE_NAME}}` - Your service name (e.g., `payment-service`)
   - `{{SERVICE_DESCRIPTION}}` - Brief description of your service
   - `{{SERVICE_PORT}}` - Port number for your service (e.g., `3002`)

3. **Update workspace configuration:** Add your service to the root `package.json` workspace if
   needed.

4. **Install dependencies:**

   ```bash
   cd backend/services/your-new-service
   pnpm install
   ```

5. **Build and test:**

   ```bash
   # Build the service
   nx build your-new-service

   # Run tests
   nx test your-new-service

   # Start in development
   nx serve your-new-service
   ```

## 📁 Template Structure

```
nestjs-service-template/
├── src/
│   ├── app/
│   │   ├── app.controller.ts
│   │   ├── app.controller.spec.ts
│   │   ├── app.module.ts
│   │   └── app.service.ts
│   ├── assets/                 # Static assets (optional)
│   └── main.ts                 # Application entry point
├── Dockerfile                  # Multi-stage Docker build
├── project.json               # NX workspace configuration
├── webpack.config.js          # Webpack configuration with NX plugin
├── package.json               # Service-specific dependencies
├── tsconfig.app.json          # TypeScript config for building
├── tsconfig.json              # Base TypeScript config
├── tsconfig.spec.json         # TypeScript config for tests
└── jest.config.ts             # Jest testing configuration
```

## ✨ Features Included

### 🐳 **Docker Support**

- Multi-stage Dockerfile optimized for production
- Uses pnpm for efficient dependency management
- Network resilience with retry logic
- Security best practices (non-root user)

### 🧪 **Testing Setup**

- Jest configuration for unit tests
- NestJS testing utilities pre-configured
- Test coverage reporting
- Integration test support

### 📦 **NX Integration**

- Proper NX workspace configuration
- Webpack build with NX plugin
- Optimized build outputs
- Caching support

### 🔧 **Development Tools**

- TypeScript configuration
- ESLint integration
- Prettier formatting
- Hot reload support

### 📚 **API Documentation**

- Swagger/OpenAPI integration
- Auto-generated API docs
- Health check endpoints

## 🛠️ Customization

### Adding Features

1. **Database Integration:**
   - Add Prisma schema to `prisma/` directory
   - Update dependencies in `package.json`
   - Add database configuration to `app.module.ts`

2. **Authentication:**
   - Add JWT/Passport modules
   - Configure guards and decorators
   - Update Swagger documentation

3. **Message Queues:**
   - Add RabbitMQ/Redis dependencies
   - Configure microservice transport
   - Add event handlers

### Environment Configuration

Create environment-specific files:

- `.env.local` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

## 🚀 Deployment

### Docker Build

```bash
docker build -t your-service-name -f backend/services/your-service/Dockerfile .
```

### Kubernetes

Use the provided Kubernetes manifests in the `k8s/` directory (copy from existing services).

## 📋 Checklist for New Services

- [ ] Replace all `{{PLACEHOLDER}}` values
- [ ] Update service name in all configuration files
- [ ] Add service to docker-compose.yml
- [ ] Create Kubernetes manifests
- [ ] Add service to CI/CD pipeline
- [ ] Update API gateway routing (if needed)
- [ ] Add monitoring and logging
- [ ] Write comprehensive tests
- [ ] Update documentation

## 🔗 Related Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [NX Documentation](https://nx.dev/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Meqenet Architecture Guide](../../docs/ARCHITECTURE.md)
