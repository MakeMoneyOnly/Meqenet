# BNPL (Buy Now, Pay Later) Implementation Guide

## Overview

This document outlines the implementation of Meqenet's BNPL (Buy Now, Pay Later) functionality, Ethiopia's first comprehensive financial super-app for flexible payments.

## Architecture

### Backend Services

#### 1. Payments Service (`/backend/services/payments-service/`)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Features**:
  - BNPL contract creation and management
  - Installment scheduling and tracking
  - Payment processing integration
  - Merchant settlement management
  - Cashback rewards system
  - Risk assessment and compliance

#### 2. Auth Service (`/backend/services/auth-service/`)
- User authentication and KYC verification
- Fayda National ID integration
- Risk scoring and fraud prevention

#### 3. API Gateway
- Request routing and load balancing
- Authentication middleware
- Rate limiting and security

### Frontend Applications

#### 1. React Native Mobile App (`/frontend/apps/app/`)
- Native iOS and Android applications
- BNPL product selection and contract creation
- Payment processing and installment tracking
- Cashback rewards dashboard

#### 2. Next.js Web Application (`/frontend/apps/website/`)
- Progressive Web App (PWA)
- Merchant dashboard and analytics
- Admin portal for operations

## BNPL Products

### 1. Pay in 4
- **Description**: Split purchase into 4 interest-free payments over 6 weeks
- **Interest Rate**: 0% APR
- **Term**: 6 weeks (payments every 2 weeks)
- **Limits**: 100 ETB - 5,000 ETB
- **Use Case**: Electronics, fashion, small appliances

### 2. Pay in 30
- **Description**: Full payment deferred for 30 days
- **Interest Rate**: 0% APR
- **Term**: 30 days
- **Limits**: 50 ETB - 10,000 ETB
- **Use Case**: Try-before-you-buy, fashion, home goods

### 3. Pay in Full
- **Description**: Immediate payment with maximum cashback
- **Interest Rate**: 0% APR
- **Term**: Immediate
- **Limits**: 10 ETB - 100,000 ETB
- **Use Case**: All purchases with cashback rewards

### 4. Financing
- **Description**: Long-term installment plans with competitive rates
- **Interest Rate**: 7.99% - 29.99% APR (based on creditworthiness)
- **Term**: 3-24 months
- **Limits**: 1,000 ETB - 100,000 ETB
- **Use Case**: Large purchases, appliances, education

## Database Schema

### Core Tables

#### Contracts
```sql
- id: Primary key
- contract_number: Unique contract identifier
- customer_id: Reference to customer
- merchant_id: Reference to merchant
- product: BNPL product type
- status: Contract status (DRAFT, ACTIVE, COMPLETED, etc.)
- principal_amount: Original purchase amount
- total_amount: Total amount including fees/interest
- outstanding_balance: Remaining balance
- apr: Annual percentage rate
- term_months: Contract duration
- payment_frequency: Payment schedule
- first_payment_date: Date of first payment
- maturity_date: Contract completion date
```

#### Installments
```sql
- id: Primary key
- contract_id: Reference to contract
- installment_number: Sequential payment number
- status: Payment status (PENDING, DUE, PAID, OVERDUE)
- scheduled_amount: Expected payment amount
- principal_amount: Principal portion
- interest_amount: Interest portion
- fee_amount: Fee portion
- due_date: Payment due date
- paid_at: Actual payment date
- paid_amount: Amount actually paid
```

#### Payments
```sql
- id: Primary key
- payment_reference: Unique payment identifier
- contract_id: Reference to contract (nullable for non-BNPL payments)
- customer_id: Reference to customer
- merchant_id: Reference to merchant
- status: Payment status
- payment_method: Payment method used
- amount: Payment amount
- currency: Payment currency (default: ETB)
- idempotency_key: Prevents duplicate processing
```

### Supporting Tables

#### Merchants
- Business information and settings
- BNPL product enablement flags
- Commission and cashback rates
- Settlement configuration

#### Cashback Rewards
- Customer cashback balance tracking
- Reward earning and redemption history
- Expiration management

#### Audit Logs
- Comprehensive audit trail for compliance
- Event-driven logging
- PII-free structured logging

## API Endpoints

### BNPL Contracts

#### POST `/api/bnpl/contracts`
Create a new BNPL contract
```json
{
  "customerId": "string",
  "merchantId": "string",
  "product": "PAY_IN_4",
  "amount": 2500,
  "description": "Purchase description",
  "merchantReference": "ORDER-12345"
}
```

#### GET `/api/bnpl/contracts/:contractId`
Get contract details with installment schedule

#### POST `/api/bnpl/payments`
Process a payment
```json
{
  "contractId": "string",
  "paymentMethod": "TELEBIRR",
  "amount": 625,
  "idempotencyKey": "unique-key"
}
```

### Products & Eligibility

#### GET `/api/bnpl/products`
Get available BNPL products and terms

#### POST `/api/bnpl/eligibility/check`
Check customer eligibility
```json
{
  "customerId": "string",
  "amount": 2500
}
```

## Payment Integration

### Supported Payment Methods

1. **Telebirr** (Primary)
   - Ethiopia's leading mobile money platform
   - Instant payment confirmation
   - Low transaction fees

2. **HelloCash**
   - Alternative mobile money option
   - CBE Bank integration

3. **CBE Birr**
   - Commercial Bank of Ethiopia integration
   - Direct bank account payments

4. **Bank Transfer**
   - Traditional bank transfer options
   - Multiple Ethiopian banks supported

### Payment Flow

1. **Contract Creation**
   - Customer selects BNPL product
   - Contract terms calculated and displayed
   - Customer accepts terms and conditions
   - Contract created and activated

2. **Payment Processing**
   - Customer initiates payment
   - Payment gateway processes transaction
   - Funds allocated to installments
   - Contract balance updated

3. **Settlement**
   - Merchants receive funds within 2-3 business days
   - Automatic settlement processing
   - Commission deducted and paid to Meqenet

## Risk Management

### Credit Scoring
- Alternative credit data analysis
- Transaction history analysis
- Behavioral pattern recognition
- Ethiopian market-specific scoring models

### Fraud Prevention
- Real-time transaction monitoring
- Device fingerprinting
- IP address analysis
- Unusual pattern detection

### Compliance
- NBE regulatory compliance
- AML/KYC verification
- Fair lending practices
- Consumer protection measures

## Cashback System

### Earning Cashback
- Percentage-based rewards (2-10% depending on merchant)
- Automatic earning on qualifying purchases
- Real-time balance updates

### Redemption Options
- Apply to future BNPL payments
- Pay bills and utilities
- Donate to charity
- Transfer to mobile money

### Tiers & Benefits
- **Bronze**: 2% base rate
- **Silver**: 3% base rate + priority support
- **Gold**: 5% base rate + exclusive offers
- **Platinum**: 10% base rate + premium benefits

## Setup Instructions

### Prerequisites
```bash
# Node.js 18+
node --version

# pnpm package manager
npm install -g pnpm

# Docker for local development
docker --version
```

### Backend Setup

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd meqenet
pnpm install
```

2. **Start database**
```bash
cd backend/services/payments-service
docker-compose up -d postgres
```

3. **Run database migrations**
```bash
npx prisma migrate dev
npx prisma generate
```

4. **Start payments service**
```bash
cd backend/services/payments-service
pnpm run start:dev
```

### Frontend Setup

1. **Install mobile dependencies**
```bash
cd frontend/apps/app
pnpm install
```

2. **Start Metro bundler**
```bash
pnpm run start
```

3. **Run on iOS/Android**
```bash
# iOS
pnpm run ios

# Android
pnpm run android
```

## Testing

### Unit Tests
```bash
# Backend tests
cd backend/services/payments-service
pnpm run test

# Frontend tests
cd frontend/apps/app
pnpm run test
```

### Integration Tests
```bash
# Run all services
docker-compose up

# Run integration tests
pnpm run test:e2e
```

### Manual Testing
1. Create test merchant account
2. Set up test payment methods
3. Test full BNPL flow from contract creation to completion

## Deployment

### Production Checklist
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Payment gateway credentials set
- [ ] Monitoring and logging configured
- [ ] Backup procedures in place

### Deployment Commands
```bash
# Build and deploy
pnpm run build
pnpm run deploy

# Health checks
curl https://api.meqenet.et/health
```

## Monitoring & Analytics

### Key Metrics
- **Conversion Rate**: BNPL adoption vs regular payments
- **Default Rate**: Payment default percentage
- **Customer Satisfaction**: NPS and feedback scores
- **Merchant Growth**: Revenue increase for partners

### Monitoring Tools
- **Prometheus**: Metrics collection
- **Grafana**: Dashboard visualization
- **ELK Stack**: Log aggregation and analysis
- **Sentry**: Error tracking and alerting

## Security Considerations

### Data Protection
- PII encryption at rest and in transit
- Tokenization for sensitive payment data
- Regular security audits and penetration testing

### Compliance
- PCI DSS compliance for payment processing
- GDPR compliance for EU customers
- Ethiopian NBE regulatory compliance

### Fraud Prevention
- Real-time fraud detection
- Machine learning-based anomaly detection
- Manual review processes for high-risk transactions

## Future Enhancements

### Phase 2 Features
- [ ] Advanced AI credit scoring
- [ ] Voice-activated payments
- [ ] QR code integration
- [ ] Blockchain-based transaction verification

### Phase 3 Features
- [ ] Agricultural financing
- [ ] Diaspora remittance services
- [ ] Investment products
- [ ] Government payment integration

---

## Support

For technical support or questions:
- **Email**: dev@meqenet.et
- **Documentation**: https://docs.meqenet.et
- **API Reference**: https://api.meqenet.et/docs

## Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
