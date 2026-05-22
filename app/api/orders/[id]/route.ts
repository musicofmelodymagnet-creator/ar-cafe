import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/app/lib/order-store';
import type { OrderStatus } from '@/app/lib/order-store';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: OrderStatus[] = ['new', 'preparing', 'ready', 'delivered'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { status: OrderStatus };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 422 }
    );
  }

  const order = updateOrderStatus(id, body.status);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order });
}
