# Meqenet Web Application & API Portal

This is the web application and API portal for Meqenet, a Buy Now Pay Later (BNPL) service for the Ethiopian market.

## Features

- **API Documentation**: Comprehensive documentation for integrating with Meqenet's BNPL services
- **Interactive API Explorer**: Test API endpoints directly from your browser
- **SDK Download Center**: Access and download SDKs for various programming languages
- **Merchant Portal**: Dashboard for merchants to manage their Meqenet integration
- **Merchant Onboarding**: Streamlined registration process for new merchants
- **Developer Resources**: SDKs, code examples, and integration guides
- **Web Application**: Web version of the Meqenet mobile app

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, React Query
- **Backend**: NestJS API (shared with mobile app)
- **Authentication**: JWT-based authentication
- **Documentation**: Swagger UI, ReDoc

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Access to Meqenet API

### Installation

1. Clone the repository
2. Navigate to the web directory:
   ```bash
   cd web
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit the `.env.local` file with your configuration.

5. Start the development server:
   ```bash
   npm run dev
   ```

   Alternatively, you can use the provided scripts:

   On Windows:
   ```
   run-dev.bat
   ```

   On Linux/Mac:
   ```
   chmod +x run-dev.sh
   ./run-dev.sh
   ```

6. Open your browser and navigate to:
   ```
   http://localhost:3001
   ```

## Project Structure

```
web/
├── public/           # Static assets
├── src/
│   ├── app/          # Next.js app directory
│   ├── components/   # Reusable UI components
│   ├── contexts/     # React contexts
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions and libraries
│   ├── services/     # API services
│   ├── styles/       # Global styles
│   └── types/        # TypeScript type definitions
├── .env.example      # Example environment variables
├── .eslintrc.js      # ESLint configuration
├── next.config.js    # Next.js configuration
├── package.json      # Project dependencies
├── tailwind.config.js # Tailwind CSS configuration
└── tsconfig.json     # TypeScript configuration
```

## API Documentation

The API documentation is available at `/api-docs` when the server is running.

## License

Proprietary - All rights reserved
