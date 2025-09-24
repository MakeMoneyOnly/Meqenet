import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    message: 'Mock API endpoint is working!',
    data: {
      timestamp: new Date().toISOString(),
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  return NextResponse.json({
    status: 'success',
    message: 'Data received successfully',
    data: {
      received: body,
      timestamp: new Date().toISOString(),
    },
  });
}
