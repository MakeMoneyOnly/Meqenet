# Meqenet BNPL API

Meqenet is a Buy Now Pay Later (BNPL) service designed specifically for the Ethiopian market. This repository contains the backend API for the Meqenet service.

## Features

- **User Authentication**: Secure JWT-based authentication with refresh tokens
- **Email & Phone Verification**: OTP-based verification for user accounts
- **KYC Verification**: Support for Ethiopian IDs (Fayda ID)
- **Credit Assessment**: Ethiopian-specific credit scoring algorithm with credit limit management
- **Payment Processing**: Integration with Ethiopian payment gateways (Telebirr)
- **Transaction Management**: Comprehensive transaction tracking and management
- **Payment Plans**: Installment payment plans with flexible terms
- **Merchant Integration**: API for merchant integration with settlement processing
- **Notifications**: Multi-channel notifications (email, SMS, in-app)

## Technology Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT, Passport
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/meqenet-backend.git
   cd meqenet-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration.

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run start:dev
   ```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the server runs on | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret for JWT signing | - |
| `JWT_EXPIRATION` | JWT expiration in seconds | `3600` |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiration in seconds | `604800` |
| `TELEBIRR_API_URL` | Telebirr API URL | - |
| `TELEBIRR_APP_ID` | Telebirr App ID | - |
| `TELEBIRR_APP_KEY` | Telebirr App Key | - |
| `TELEBIRR_PUBLIC_KEY` | Telebirr Public Key | - |
| `HELLOCASH_API_URL` | HelloCash API URL | - |
| `HELLOCASH_API_KEY` | HelloCash API Key | - |
| `CHAPA_API_URL` | Chapa API URL | - |
| `CHAPA_SECRET_KEY` | Chapa Secret Key | - |
| `SMS_PROVIDER_API_KEY` | SMS Provider API Key | - |
| `EMAIL_SERVICE_API_KEY` | Email Service API Key | - |

## API Documentation

API documentation is available at `/docs` when the server is running. It is built with Swagger/OpenAPI.

### Main Endpoints

- **Authentication**: `/api/v1/auth/*`
- **Users**: `/api/v1/users/*`
- **Credit**: `/api/v1/credit/*`
- **Transactions**: `/api/v1/transactions/*`
- **Payment Gateways**: `/api/v1/payment-gateways/*`
- **Merchants**: `/api/v1/merchants/*`

## Testing

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Payment flow test
npm run test:payment-flow

# Test coverage
npm run test:cov

# Run all tests with script
./scripts/run-tests.sh
```

## Deployment

### Production Build

```bash
npm run build
```

### Running in Production

```bash
npm run start:prod
```

### Docker

```bash
# Build the Docker image
docker build -t meqenet-backend .

# Run the container
docker run -p 3000:3000 meqenet-backend
```

## Project Structure

```
src/
├── app.module.ts              # Main application module
├── main.ts                    # Application entry point
├── auth/                      # Authentication module
│   ├── controllers/           # Auth controllers
│   ├── dto/                   # Data transfer objects
│   ├── guards/                # Auth guards
│   ├── interfaces/            # Auth interfaces
│   ├── services/              # Auth services
│   └── strategies/            # Passport strategies
├── credit/                    # Credit module
│   ├── controllers/           # Credit controllers
│   ├── dto/                   # Data transfer objects
│   └── services/              # Credit services
├── payment-gateways/          # Payment gateways module
│   ├── controllers/           # Payment controllers
│   ├── dto/                   # Data transfer objects
│   ├── interfaces/            # Payment interfaces
│   └── services/              # Payment services
├── users/                     # Users module
│   ├── controllers/           # User controllers
│   ├── dto/                   # Data transfer objects
│   └── services/              # User services
├── transactions/              # Transactions module
│   ├── controllers/           # Transaction controllers
│   ├── dto/                   # Data transfer objects
│   └── services/              # Transaction services
├── notifications/             # Notifications module
│   ├── dto/                   # Data transfer objects
│   ├── enums/                 # Notification enums
│   └── services/              # Notification services
└── prisma/                    # Prisma ORM configuration
    ├── schema.prisma          # Database schema
    └── migrations/            # Database migrations
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - All Rights Reserved

## Contact

- **Website**: [meqenet.et](https://meqenet.et)
- **Email**: support@meqenet.et
