# Meqenet 2.0 - Product Requirements Document (PRD)

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision & Objectives](#product-vision--objectives)
3. [Market Analysis](#market-analysis)
4. [User Personas](#user-personas)
5. [Core Features](#core-features)
6. [Payment Options](#payment-options)
7. [User Experience Requirements](#user-experience-requirements)
8. [Business Model](#business-model)
9. [Success Metrics](#success-metrics)
10. [Risk Assessment](#risk-assessment)
11. [Future Roadmap](#future-roadmap)

---

## 📊 Executive Summary

### Product Vision

Meqenet 2.0 is Ethiopia's first comprehensive financial super-app, combining enterprise-grade Buy
Now, Pay Later (BNPL) services with a complete shopping ecosystem, cashback rewards, and financial
wellness tools. Designed specifically for the Ethiopian market, Meqenet offers **flexible payment
options** including both interest-free and competitive financing solutions.

### Key Value Propositions

#### For Ethiopian Consumers

- **Flexible Payment Options**: Interest-free short-term and competitive financing plans
- **Pay in 4**: Four interest-free installments over 6 weeks
- **Pay in 30**: Full payment deferred for 30 days with buyer protection
- **Competitive Financing**: 3-24 month plans with transparent rates (7.99%-29.99% APR)
- **Cashback Ecosystem**: Up to 10% cashback at partner merchants
- **Fayda ID Integration**: Exclusively uses Ethiopian Fayda National ID for KYC
- **Local Language Support**: Full Amharic and English support
- **Ethiopian Holiday Promotions**: Culturally relevant seasonal campaigns

#### For Ethiopian Merchants

- **Immediate Settlement**: Receive funds within 2-3 business days in ETB
- **Zero Credit Risk**: Meqenet assumes all payment collection risk
- **Increased Conversions**: 30%+ boost in conversion rates
- **Higher AOV**: 40%+ increase in average order values
- **NBE Compliance**: Full regulatory compliance support

---

## 🎯 Product Vision & Objectives

### Mission Statement

Democratize access to goods and services in Ethiopia by providing flexible, fair, and transparent
payment solutions that empower consumers and drive merchant growth.

### Primary Objectives

- **Market Leadership**: Become Ethiopia's leading financial super-app and BNPL platform
- **Financial Inclusion**: Expand access to credit for 65% underbanked Ethiopian population
- **Digital Ethiopia 2025**: Align with Ethiopia's national digital transformation strategy
- **Merchant Growth**: Drive 30%+ conversion rate increases for partner merchants
- **Regulatory Excellence**: Maintain 100% compliance with Ethiopian financial regulations

### Target Platforms

- **Mobile Apps**: Native iOS and Android applications (primary focus)
- **Web Application**: Progressive Web App (PWA) for desktop and mobile browsers
- **Browser Extension**: Chrome/Firefox extension for Ethiopian e-commerce sites
- **Merchant Portal**: Comprehensive web-based dashboard for business partners
- **Admin Portal**: Enterprise-grade backoffice system

---

## 📈 Market Analysis

### Ethiopian Market Opportunity

- **Population**: 120+ million people with growing middle class
- **Mobile Penetration**: 45% smartphone adoption with rapid growth
- **Banking Gap**: 35% banked population, 65% underbanked opportunity
- **E-commerce Growth**: 25%+ annual growth rate
- **Youth Demographics**: 60% population under 25 years old
- **Urban Growth**: Rapid urbanization in Addis Ababa, Dire Dawa, Bahir Dar

### Market Context

- **Digital Ethiopia 2025**: Government initiative driving digital transformation
- **Payment Ecosystem**: Growing adoption of Telebirr, M-Pesa, HelloCash
- **Cultural Factors**: Strong community focus, family financial decisions
- **Regulatory Environment**: Progressive NBE policies supporting FinTech innovation

---

## 👥 User Personas

### Persona 1: Abebe, the Young Professional

**Demographics**: 26 years old, software developer, 8,000 ETB monthly income

- **Needs**: Flexible payment options for electronics, budget management, cashback rewards
- **Pain Points**: Limited cash flow for large purchases, no credit card access
- **BNPL Usage**: Prefers Pay in 4 for phones/laptops, uses financing for larger appliances
- **Language**: Primarily English for tech purchases, Amharic for local services

### Persona 2: Tigist, the Fashion-Forward Student

**Demographics**: 22 years old, university student, 2,500 ETB monthly allowance

- **Needs**: Affordable fashion options, try-before-you-buy, social sharing features
- **Pain Points**: Limited budget, fear of online shopping fraud, cart abandonment
- **BNPL Usage**: Uses Pay in 30 for clothing to try items first, active in social features

### Persona 3: Mekdes, the Small Business Owner

**Demographics**: 34 years old, boutique owner, 15,000 ETB monthly revenue

- **Needs**: Increased sales, customer payment flexibility, inventory management
- **Pain Points**: Cash flow management, lost sales due to price sensitivity
- **Platform Usage**: Uses merchant portal for analytics, creates promotional campaigns

### Persona 4: Dawit, the Budget-Conscious Family Man

**Demographics**: 31 years old, bank employee, 12,000 ETB monthly income, 2 children

- **Needs**: Family budget management, bulk shopping discounts, educational savings
- **Pain Points**: Managing family expenses, unexpected costs
- **BNPL Usage**: Uses financing options for appliances, family shopping during holidays

---

## 🚀 Core Features

### 1. Consumer Mobile & Web Application

#### Authentication & Onboarding

- **Registration**: Phone/email + KYC verification with Fayda ID (exclusive)
- **Login Options**: Biometric, PIN, password, social login
- **Two-Factor Authentication**: SMS/app-based 2FA
- **Identity Verification**: Ethiopian Fayda National ID only

#### User Dashboard

- **Overview**: Available credit, active loans, credit score, quick actions
- **Payment Management**: Upcoming payments calendar, payment history, auto-pay setup
- **Profile Management**: Personal info, documents, notifications, security settings

#### Shopping & Discovery

- **Merchant Directory**: Browse partner merchants by category
- **Product Search**: Search products across all merchants
- **Wishlist**: Save items for later purchase
- **Recommendations**: Personalized product suggestions

#### Financial Wellness

- **Budgeting Tools**: Spending categorization and budget tracking
- **Savings Goals**: Goal-based savings tracking
- **Financial Education**: Interactive financial literacy modules
- **Credit Improvement**: Credit score improvement tips and guidance

### 2. Checkout Flow (Online & In-Store)

#### Online Checkout Integration

- **SDK Integration**: JavaScript, React, React Native, REST API
- **Checkout Widgets**: Embedded, modal, redirect, hosted options
- **Real-time Eligibility**: Instant pre-qualification checks
- **Payment Plan Selection**: Clear display of all available options
- **Terms Display**: Transparent terms, fees, and total cost breakdown

#### Checkout Process Steps

1. **Product Selection**: Show all BNPL options with real-time calculations
2. **User Identification**: Quick registration or one-click login
3. **Credit Check**: Real-time assessment < 500ms with instant decision
4. **Payment Terms**: Choose from available options with clear terms
5. **Confirmation**: Complete purchase breakdown and receipt

### 3. Merchant Dashboard & Portal

#### Merchant Onboarding

- **Business Verification**: License, tax ID, bank statements verification
- **Document Processing**: Automated verification with manual review
- **Compliance Checks**: AML/KYC business verification
- **Integration Setup**: API keys, testing environment, go-live process

#### Dashboard Features

- **Sales Overview**: Daily/weekly/monthly performance metrics
- **BNPL Analytics**: Performance comparison vs regular payments
- **Customer Insights**: Behavior analysis and demographics
- **Settlement Management**: Payment processing and reconciliation

#### Tools & Services

- **Campaign Management**: Create promotional offers and discounts
- **Inventory Integration**: Real-time stock synchronization
- **Customer Support**: Direct merchant support portal
- **API Documentation**: Comprehensive integration guides

### 4. Admin/Backoffice System

#### User Management

- **Customer Administration**: Profile management, KYC review, credit adjustments
- **Account Management**: Status controls, support tickets, compliance records
- **Merchant Administration**: Onboarding approval, contract management, performance monitoring

#### Risk & Compliance Management

- **Credit Risk**: Scoring models, risk policies, portfolio analysis
- **Fraud Prevention**: Real-time monitoring, alert management, case investigation
- **Compliance Oversight**: Regulatory reporting, audit trails, policy enforcement

#### Analytics & Reporting

- **Business Intelligence**: Performance dashboards and KPI tracking
- **Financial Reporting**: Transaction volumes, revenue analysis, risk metrics
- **Regulatory Reporting**: NBE compliance reports and audit documentation

---

## 💳 Payment Options

### 1. Pay in 4 (Interest-Free)

**Structure**: 4 equal payments over 6 weeks

- **Interest Rate**: 0% APR (completely interest-free)
- **First Payment**: 25% at purchase
- **Subsequent Payments**: Every 2 weeks automatically
- **Late Fees**: ETB 50 per missed payment (capped at 25% of purchase)
- **Eligibility**: Soft credit check, instant approval
- **Limits**: 100 ETB - 5,000 ETB

### 2. Pay in 30 (Interest-Free)

**Structure**: Full payment deferred for 30 days

- **Interest Rate**: 0% APR (completely interest-free)
- **Payment Due**: 30 days after purchase
- **Buyer Protection**: Full return policy within 30 days
- **Late Fees**: ETB 100 after grace period
- **Use Case**: Try-before-you-buy, especially fashion
- **Limits**: 50 ETB - 10,000 ETB

### 3. Pay in Full

**Structure**: Immediate payment

- **Benefits**: Full cashback rates, buyer protection, no fees
- **Payment Methods**: Telebirr, M-Pesa, cards, bank transfer
- **Protection**: Purchase protection and extended warranties
- **Limits**: 10 ETB - No maximum limit

### 4. Financing (3-24 Months)

**Structure**: Monthly installment plans with interest

- **Terms Available**: 3, 6, 12, 24 month payment plans
- **APR Range**: 7.99% - 29.99% based on creditworthiness
- **Qualification**: Comprehensive credit check required
- **Early Payment**: No prepayment penalties
- **Use Cases**: Large purchases, appliances, education
- **Limits**: 1,000 ETB - 100,000 ETB

---

## 🎨 User Experience Requirements

### Design Principles

- **Mobile-First**: Optimized for Ethiopian mobile devices and networks
- **Cultural Relevance**: Ethiopian calendar, holidays, local imagery
- **Language Support**: Full Amharic and English localization
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design
- **Trust & Transparency**: Clear payment terms, no hidden fees

### Ethiopian Localization

- **Amharic Language**: Right-to-left text support, cultural terminology
- **Ethiopian Calendar**: Native calendar support for dates and holidays
- **Cultural Elements**: Ethiopian model photography, local scenarios
- **Holiday Integration**: Timkat, Meskel, Ethiopian New Year campaigns
- **Community Features**: Group buying, family accounts, social sharing

### Performance Requirements

- **Network Optimization**: Efficient on 2G/3G networks
- **Offline Capabilities**: Core features work without internet
- **Load Times**: < 3 seconds on typical Ethiopian networks
- **Battery Optimization**: Minimal battery drain on older devices

---

## 💼 Business Model

### Revenue Streams

1. **Merchant Fees**: 3-6% commission per transaction
2. **Consumer Transaction Fees**: ETB 5-25 per transaction (transparent, capped)
3. **Interest Income**: From financing products (7.99%-29.99% APR)
4. **Meqenet Plus Subscription**: Premium subscription (199 ETB/month)
5. **Cashback Program Revenue**: Strategic partnerships with brands
6. **Premium Services**: Enhanced merchant analytics and promotional tools

### Cashback & Rewards System

- **Earning Rates**: 2-10% cashback depending on merchant category
- **Redemption Options**: Apply to BNPL payments, pay bills, donate to charity
- **Loyalty Tiers**: Bronze, Silver, Gold, Platinum based on annual spending
- **Premium Benefits**: Enhanced rates, exclusive access, priority support

### Target Market Segments

- **Primary Consumers**: Young professionals, students, urban middle class, families
- **Merchant Categories**: Fashion, electronics, home goods, healthcare, education
- **Geographic Focus**: Urban centers with expansion to secondary cities

---

## 📊 Success Metrics

### User Acquisition & Engagement

- **New Users**: 2,000+ new Ethiopian users per week
- **Monthly Active Users**: 75,000+ MAU by year 1
- **Retention Rates**: 70% (30-day), 50% (90-day)
- **Referral Rate**: 25% of new users from referrals

### Financial Performance

- **Transaction Volume**: 50M+ ETB per month
- **Average Order Value**: 2,500 ETB
- **Default Rate**: < 3% across all payment products
- **Merchant Growth**: 500+ Ethiopian merchant partners

### Payment Product Performance

- **Pay in 4 Adoption**: > 40% of transactions
- **Pay in 30 Adoption**: > 25% of transactions
- **Financing Adoption**: > 20% of transactions
- **Pay in Full Adoption**: > 15% of transactions

### Cultural Engagement

- **Amharic Usage**: > 60% of users engage with Amharic content
- **Holiday Participation**: > 80% users active during Ethiopian holidays
- **Social Features**: > 50% users share deals with friends/family
- **Cashback Adoption**: > 70% users actively earn and redeem cashback

---

## ⚠️ Risk Assessment

### Market Risks

- **Regulatory Changes**: NBE policy modifications affecting operations
- **Economic Volatility**: Ethiopian birr fluctuations and inflation
- **Competition**: International BNPL players entering Ethiopian market
- **Technology Infrastructure**: Network reliability and payment system outages

### Operational Risks

- **Credit Risk**: Higher default rates than projected
- **Fraud Risk**: Payment fraud and identity theft
- **Cybersecurity**: Data breaches and system compromises
- **Merchant Risk**: Merchant fraud or failure to deliver goods

### Mitigation Strategies

- **Diversified Payment Methods**: Multiple Ethiopian payment integrations
- **Conservative Credit Policies**: Gradual credit limit increases
- **Advanced Fraud Detection**: ML-based real-time fraud prevention
- **Strong Security Framework**: Multi-layer security implementation
- **Regulatory Compliance**: Proactive NBE engagement and compliance

---

## 🔮 Future Roadmap

### Phase 1 (Year 1): Core Platform

- Launch core BNPL payment options
- Onboard 500+ Ethiopian merchants
- Achieve 75,000+ monthly active users
- Establish cashback program with major brands

### Phase 2 (Year 2): Ecosystem Expansion

- **Advanced Financial Services**: Savings accounts, micro-insurance
- **Agricultural Finance**: Seasonal financing for Ethiopian farmers
- **Investment Products**: Ethiopian stock market investment tools
- **Diaspora Services**: Remittance and investment for Ethiopians abroad

### Phase 3 (Year 3): Regional Expansion

- **East Africa Expansion**: Kenya, Uganda, Tanzania markets
- **B2B Services**: Business-to-business financing solutions
- **Government Integration**: Digital payments for government services
- **Advanced AI**: Ethiopian-specific credit scoring and voice payments

### Technology Innovation Pipeline

- **AI Credit Scoring**: Ethiopian alternative credit data analysis
- **Voice Payments**: Amharic voice-activated payment processing
- **Blockchain Integration**: Enhanced transaction transparency
- **IoT Payments**: Smart city payment integration

---

**Document Version**: 2.0 (Streamlined)  
**Last Updated**: January 2025  
**Next Review**: February 2025

---

_This PRD defines the product requirements for Meqenet 2.0, Ethiopia's leading financial super-app.
For technical implementation details, see Architecture.md, Tech_Stack.md, and Security.md._
