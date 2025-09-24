import { NextResponse, NextRequest } from 'next/server';

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
    createdAt: '2024-08-16T10:00:00Z',
    updatedAt: '2024-08-16T10:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  // Check for API key
  const url = new URL(request.url);
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'API key is required',
      },
      { status: 401 }
    );
  }
  
  // Get query parameters
  const status = url.searchParams.get('status');
  
  // Filter transactions if status is provided
  let filteredTransactions = transactions;
  if (status) {
    filteredTransactions = transactions.filter(tx => tx.status === status);
  }
  
  return NextResponse.json({
    status: 'success',
    data: filteredTransactions,
    meta: {
      currentPage: 1,
      totalPages: 1,
      totalItems: filteredTransactions.length,
      itemsPerPage: 10,
    },
  });
}

export async function POST(request: NextRequest) {
  // Check for API key
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'API key is required',
      },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.amount || !body.currency || !body.customer || !body.items || !body.redirectUrl) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing required fields',
        },
        { status: 400 }
      );
    }
    
    // Create a new transaction
    const newTransaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 15),
      amount: body.amount,
      currency: body.currency,
      status: 'PENDING',
      customer: body.customer,
      items: body.items,
      redirectUrl: body.redirectUrl,
      paymentUrl: `https://pay.flexpay.et/checkout/${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json({
      status: 'success',
      data: newTransaction,
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Invalid request body',
      },
      { status: 400 }
    );
  }
}
