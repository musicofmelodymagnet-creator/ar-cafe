import { NextRequest, NextResponse } from 'next/server';
import { createOrder, getAllOrders } from '@/app/lib/order-store';
import type { CartItem } from '@/app/types';

export const dynamic = 'force-dynamic';

interface OrderRequestBody {
  tableNumber: number;
  items: CartItem[];
  totalPrice: number;
}

export async function POST(req: NextRequest) {
  let body: OrderRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tableNumber, items, totalPrice } = body;

  if (!Number.isInteger(tableNumber) || tableNumber < 0) {
    return NextResponse.json({ error: 'Invalid tableNumber' }, { status: 422 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items must be a non-empty array' }, { status: 422 });
  }
  if (typeof totalPrice !== 'number' || totalPrice <= 0) {
    return NextResponse.json({ error: 'Invalid totalPrice' }, { status: 422 });
  }

  const order = createOrder(tableNumber, items, totalPrice);
  return NextResponse.json({ order }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ orders: getAllOrders() });
}
