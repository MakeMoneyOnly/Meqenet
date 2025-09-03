# Ethiopian Payment Gateway Simulator

This tool provides a mock server to simulate the APIs of Ethiopian payment providers, starting with
Telebirr. It is intended for local development and integration testing, as outlined in the project's
testing guidelines (FND-TEST-SIM-01).

## Features

- Mock endpoints for initiating payments and checking transaction status.
- Simulates successful and failed transactions.
- Simulates asynchronous callbacks (webhooks) to a provided `notifyUrl`.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or pnpm

### Installation

Navigate to this directory and install the dependencies:

```bash
cd tools/payment-simulator
npm install
```

### Running the Simulator

To start the mock server, run:

```bash
npm start
```

The server will start on `http://localhost:3005` by default.

## API Endpoints

### `POST /payment`

Initiates a mock payment.

**Request Body:**

```json
{
  "amount": 100.5,
  "nonce": "a-unique-string",
  "appId": "your-app-id",
  "appKey": "your-app-key",
  "notifyUrl": "http://localhost:3000/api/webhook/payment-callback"
}
```

**Responses:**

- `200 OK`: Payment initiated. The simulator will also attempt to send a POST request to the
  `notifyUrl` after a short delay.
- `400 Bad Request`: Missing required parameters.

### `GET /status/:transactionId`

Checks the status of a previously initiated transaction.

**Responses:**

- `200 OK`: Returns the transaction status.
- `404 Not Found`: Transaction ID does not exist.
