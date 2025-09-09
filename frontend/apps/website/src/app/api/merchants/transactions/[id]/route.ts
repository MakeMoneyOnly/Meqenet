import { NextRequest, NextResponse } from 'next/server';

// Sample transactions data
const transactions = [
  {
    id: 'tx_123456789',
    amount: 1000,
    currency: 'ETB',
    status: 'COMPLETED',
    customer: {
      phoneNumber: '+251912345678',
      email: 'customer@example.com',
    },
    items: [
      {
        name: 'Product Name',
        price: 1000,
        quantity: 1,
        description: 'Product description',
      },
    ],
    redirectUrl: 'https://example.com/checkout/complete',
    paymentUrl: 'https://pay.flexpay.et/checkout/tx_123456789',
    createdAt: '2024-08-15T12:00:00Z',
    updatedAt: '2024-08-15T12:30:00Z',
  },
  {
    id: 'tx_987654321',
    amount: 2500,
    currency: 'ETB',
    status: 'PENDING',
    customer: {
      phoneNumber: '+251923456789',
      email: 'another@example.com',
    },
    items: [
      {
        name: 'Another Product',
        price: 2500,
        quantity: 1,
        description: 'Another product description',
      },
    ],
    redirectUrl: 'https://example.com/checkout/complete',
    paymentUrl: 'https://pay.flexpay.et/checkout/tx_987654321',
    createdAt: '2024-08-16T10:00:00Z',
    updatedAt: '2024-08-16T10:00:00Z',
  },
];

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const { params } = props;
  const { id } = await params;
  // Check for API key
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'API key is required',
      },
      { status: 401 },
    );
  }

  // Find transaction by ID
  const transaction = transactions.find((tx) => tx.id === id);

  if (!transaction) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Transaction not found',
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    status: 'success',
    data: transaction,
  });
}
