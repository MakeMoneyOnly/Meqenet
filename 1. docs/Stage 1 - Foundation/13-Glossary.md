# 13. Glossary of Terms

## Overview

This document provides definitions for terminology used throughout the Meqenet comprehensive Buy
Now, Pay Later (BNPL) financial ecosystem and its documentation. It serves as a common reference for
technical, financial, and domain-specific terms.

## A

### Acquiring Bank

A bank or financial institution that processes credit or debit card payments on behalf of a
merchant.

### Alternative Data

Non-traditional data sources used for credit risk assessment, particularly relevant in markets like
Ethiopia where formal credit histories may be limited. Examples include mobile phone usage patterns,
utility bill payments, transaction history from mobile money platforms, and marketplace activity
patterns.

### Alternative Data Score

A score derived from analyzing alternative data points, used as input for credit risk assessment,
particularly important in the Ethiopian context.

### Analytics Dashboard

A comprehensive business intelligence interface providing insights into user behavior, transaction
patterns, merchant performance, and financial metrics across the Meqenet.et ecosystem.

### API (Application Programming Interface)

A set of rules that allows different software applications to communicate with each other.
Meqenet.et uses APIs for merchant integration, payment gateway communication, KYC providers, and for
communication between internal microservices.

### API Gateway

A server that acts as a single entry point into the system. It accepts all API calls, aggregates the
various services required to fulfill them, and returns the appropriate result. The API Gateway is
the front door for all our backend microservices, handling concerns like routing, authentication,
and rate limiting.

### APR (Annual Percentage Rate)

The yearly interest rate charged for borrowing, expressed as a percentage. Used in Meqenet.et's "Pay
Over Time" financing options (15-22% APR for 6-24 month plans).

### Authentication

The process of verifying the identity of a user (customer or merchant) or system. This might involve
passwords, OTPs (One-Time Passwords) sent via SMS, or integration with national identity systems
like Fayda.

### Authorization

The process of determining whether an authenticated user has permission to access a specific
resource or perform a specific action (e.g., make a purchase, view transaction history, access
premium features).

## B

### Backend

The server-side of the Meqenet.et application. In our architecture, the backend is not a single
application (a monolith) but rather a collection of distributed, independently deployable
**microservices** that work together to provide the platform's functionality. Built using **NestJS
(Node.js)**.

### BNPL (Buy Now, Pay Later)

A type of short-term financing that allows consumers to make purchases and pay for them at a future
date, often in interest-free installments. Meqenet.et offers four options: Pay in 4, Pay in 30, Pay
Over Time, and Pay in Full Today.

### Bounded Context

A central pattern in Domain-Driven Design (DDD). It is the boundary within which a specific business
domain model is defined and applicable. In our architecture, each **microservice** is designed to
align with a single Bounded Context (e.g., "Payments," "Identity," "Rewards").

### Bronze Tier

The entry-level loyalty tier in Meqenet.et's rewards system, offering 1% cashback on purchases and
basic benefits.

### Business Logic

The core rules and processes that govern how the Meqenet.et platform operates, including how credit
decisions are made, payments are processed, fees are calculated, rewards are distributed, and
marketplace transactions are handled.

## C

### Cache

A component that stores frequently accessed data temporarily to speed up access times. Used for
improving performance of user sessions, merchant details, product catalogs, etc. (Using **Redis**).

### Cashback

Money returned to customers as a reward for making purchases through Meqenet.et, ranging from 1% to
5% based on loyalty tier and stored in Meqenet Balance.

### CI/CD (Continuous Integration/Continuous Deployment)

Automation pipeline for building, testing, and deploying code changes frequently and reliably,
supporting Feature-Sliced Architecture with feature-specific deployment capabilities. (Using
**GitHub Actions**).

### Compliance

Adherence to laws, regulations, standards, and ethical practices. For Meqenet.et Ethiopia, this
includes compliance with NBE directives, data protection regulations, consumer protection laws, and
transparent financing terms disclosure.

### Credit Limit

The maximum amount of credit available to a customer through the Meqenet.et platform, which may vary
based on payment option and customer profile.

### Credit Risk Assessment

The process of evaluating a potential borrower's likelihood of defaulting on their loan obligations.
In the Ethiopian context, this heavily relies on alternative data, marketplace activity, rewards
engagement, and custom ML-powered scoring models.

### Credit Scoring Model

An AI/ML algorithm used to assign a numerical score to a customer representing their
creditworthiness, based on various data points including marketplace behavior, payment history, and
alternative data sources.

### CRUD

Create, Read, Update, Delete - the four basic operations for managing data in a persistent store
(like a database).

### Customer Due Diligence (CDD)

See KYC (Know Your Customer).

## D

### Dashboard

A user interface providing a visual overview of key information, such as a customer's payment
schedule, Meqenet Balance, loyalty status, marketplace activity, or a merchant's sales volume,
settlements, and analytics insights.

### Data Minimization

The principle and practice of limiting the collection and retention of personal data to only what is
necessary for a specific, legitimate purpose, crucial for compliance with data protection laws.

### Database

A structured collection of data. Meqenet.et uses a database (**PostgreSQL**) to store user
information, loan details, transaction history, merchant data, product catalogs, rewards data,
virtual card information, etc., adhering to data privacy regulations.

### Default

Failure to repay a loan according to the agreed-upon terms.

### Deployment

The process of releasing new code or updates to a specific environment (e.g., staging, production),
supporting feature-specific deployments in the Feature-Sliced Architecture.

### Docker

A platform for developing, shipping, and running applications in containers, ensuring consistency
across different environments.

### Dynamic QR Code

A QR code that can be updated with different payment amounts and merchant information, used in
Meqenet.et's QR payment system.

## E

### Encryption

The process of converting data into code to prevent unauthorized access. Used to protect sensitive
customer data, transaction data, virtual card information, and Fayda National ID data both in
transit (e.g., TLS/SSL) and at rest.

### Environment

A distinct setup where the application runs (e.g., Development, Staging, Production).

### ETB (Ethiopian Birr)

The official currency of Ethiopia.

## F

### Fayda

Ethiopia's national digital identity system. Meqenet.et exclusively uses Fayda National ID for
KYC/identity verification purposes, replacing all other forms of identification.

### Feature-Sliced Architecture (FSA)

A mandatory architectural pattern for Meqenet.et that organizes **codebases** (both frontend and
backend) by business features. It complements our **Microservice Architecture** by providing a
clear, scalable structure for the code _within_ each individual service or client application.

### Fees

Charges associated with using the BNPL service, which could include late fees, processing fees (for
merchants), interest on longer-term financing, or premium subscription fees.

### Financial Institution (FI)

An entity engaged in financial activities, such as banks, microfinance institutions (MFIs), or
mobile money providers. Meqenet.et interacts with FIs for payment processing and potentially
funding.

### FinOps

Financial Operations; a cultural practice and framework that brings financial accountability to the
variable spend model of cloud, enabling distributed teams to make trade-offs between speed, cost,
and quality.

### Fraud Detection

AI/ML-powered systems and processes designed to identify and prevent fraudulent activities, such as
identity theft, unauthorized transactions, marketplace fraud, or rewards manipulation, tailored to
common patterns observed in Ethiopia.

### Frontend

The client-side of the Meqenet.et application that users interact with (mobile app and web
platform). Built using **React Native** for mobile and **Next.js** for web, with **Redux Toolkit**
for state management and Feature-Sliced Architecture organization.

## G

### Gateway (Payment Gateway)

A service that authorizes and processes electronic payments (e.g., credit cards, mobile money)
between customers, merchants, and financial institutions. Integration with Ethiopian payment
gateways (like Chapa, Telebirr's backend) is crucial.

### Gold Tier

The third loyalty tier in Meqenet.et's rewards system, offering 3% cashback on purchases and
enhanced benefits including priority support.

## I

### Installment

One of a series of regular payments made over time to repay a loan. Meqenet.et offers various
installment options: 4 payments (Pay in 4), single payment (Pay in 30), or monthly payments (Pay
Over Time).

### Integration

Connecting the Meqenet.et platform with other systems, such as e-commerce platforms, payment
gateways, KYC providers (Fayda), accounting software, or cross-feature integration within the FSA.

### Interest Rate

The percentage charged on borrowed money over time. Applied to Meqenet.et's "Pay Over Time" options
(15-22% APR) while Pay in 4 and Pay in 30 remain interest-free.

## K

### KYC (Know Your Customer) / KYB (Know Your Business)

Regulatory requirements for financial services providers to verify the identity of their customers
and merchants to prevent money laundering, terrorism financing, and fraud. Meqenet.et exclusively
uses Fayda National ID for identity verification.

## L

### Late Fee

A penalty charged to a customer for failing to make a payment by the due date.

### Loan Agreement

A legal contract outlining the terms and conditions of the BNPL arrangement between Meqenet.et and
the customer, including interest rates for applicable payment options.

### Loan Management System (LMS)

Software used to manage the entire lifecycle of a loan, from origination and disbursement to
repayment tracking and collections. Meqenet.et's core backend functions as a comprehensive LMS.

### Loan Origination

The process of creating and approving a new loan (BNPL plan) for a customer, including credit
assessment and payment option selection.

### Loyalty Tier

A classification system in Meqenet.et's rewards program with four levels: Bronze (1% cashback),
Silver (2% cashback), Gold (3% cashback), and Platinum (5% cashback), with additional benefits at
higher tiers.

## M

### Marketplace

Meqenet.et's comprehensive e-commerce platform where customers can browse, search, and purchase
products from verified merchants using any of the four payment options.

### MDR (Merchant Discount Rate)

A fee charged to merchants by the BNPL provider (Meqenet.et) for each transaction processed using
the service. This is a primary revenue source.

### Meqenet Balance

A digital wallet within the Meqenet.et ecosystem where cashback rewards are stored and can be used
for purchases, bill payments, or other transactions.

### Meqenet Plus

The premium subscription service offered at 49 ETB/month, providing enhanced cashback rates (up to
5%), priority support, exclusive offers, advanced analytics, and higher transaction limits.

### Merchant

A business that accepts Meqenet.et as a payment method for its goods or services through the
marketplace or direct integration.

### Merchant Agreement

A contract between Meqenet.et and a merchant outlining the terms of service, fees (MDR), settlement
procedures, and responsibilities.

### Merchant Portal

A web interface for merchants to manage their Meqenet.et integration, view transactions, track
settlements, access reporting, manage product catalogs, and view analytics insights.

### Microfinance Institution (MFI)

Financial institutions providing services to low-income individuals or small businesses, common in
Ethiopia. Meqenet.et might partner with MFIs.

### Microservice Architecture

An architectural style that structures an application as a collection of loosely coupled,
independently deployable services organized around business capabilities. This is the primary
architectural pattern for the Meqenet backend, chosen for its scalability, resilience, and
flexibility.

### Mobile Money

Electronic wallet services allowing users to store, send, and receive money using their mobile
phones. Crucial in Ethiopia (e.g., Telebirr, HelloCash).

### Monitoring

Observing and tracking the performance, availability, and health of the Meqenet.et platform and
infrastructure, including feature-specific monitoring in the FSA.

## N

### NBE (National Bank of Ethiopia)

The central bank of Ethiopia, responsible for regulating banks, payment systems, and financial
institutions. Meqenet.et must operate in compliance with NBE directives.

## O

### Onboarding

The process of registering and verifying new customers or merchants onto the Meqenet.et platform,
including Fayda National ID verification.

### Origination Fee

A fee charged at the beginning of a loan to cover processing costs (less common in simple BNPL, but
possible).

### OTP (One-Time Password)

A password valid for only one login session or transaction, commonly sent via SMS for security
verification.

## P

### Pay in 4

Meqenet.et's interest-free payment option allowing customers to split purchases (100-5,000 ETB) into
4 equal payments made every 2 weeks.

### Pay in 30 Days

Meqenet.et's interest-free payment option allowing customers to pay the full amount (50-10,000 ETB)
within 30 days of purchase.

### Pay in Full Today

Meqenet.et's immediate payment option (10 ETB+) that provides buyer protection and contributes to
rewards earning.

### Pay Over Time

Meqenet.et's extended financing option for larger purchases (1,000-100,000 ETB) with 6-24 month
terms and 15-22% APR interest rates.

### Payment Gateway

See Gateway.

### Payment Plan / Schedule

The agreed schedule of installment payments, including amounts, due dates, and interest rates (if
applicable).

### PCI-DSS (Payment Card Industry Data Security Standard)

A set of security standards designed to ensure that all companies that accept, process, store, or
transmit credit card information maintain a secure environment. (_Note: Direct applicability to
Meqenet.et Ethiopia depends on whether international card brands like Visa/Mastercard are processed.
Secure handling of local payment methods follows NBE guidelines._)

### Platinum Tier

The highest loyalty tier in Meqenet.et's rewards system, offering 5% cashback on purchases and
premium benefits including exclusive offers and advanced financial tools.

### Polyglot Persistence

The practice of using multiple different data storage technologies for different microservices based
on their specific needs. For example, using a relational database (PostgreSQL) for transactional
services and a NoSQL database for a product catalog. This is a core principle of our decentralized
data management strategy.

### Point of Sale (POS)

The physical location where a transaction occurs (e.g., a retail store checkout). Meqenet.et offers
QR code solutions for in-store payments.

## S

### Service

An independently deployable component in a microservice architecture that owns a specific business
capability. For example, the "Payment Service" or the "User Service".

### Service Mesh

A dedicated infrastructure layer for making service-to-service communication safe, fast, and
reliable. It handles concerns like service discovery, load balancing, encryption, and circuit
breaking. While not part of the initial implementation, it is a future consideration for managing
complex service interactions.
