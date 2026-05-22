import { NextRequest, NextResponse } from 'next/server';
import { deliverTable, billTable, payTable } from '@/app/lib/order-store';

export const dynamic = 'force-dynamic';

type TableAction = 'deliver' | 'bill' | 'pay';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ n: string }> }
) {
  const { n } = await params;
  const table = Number(n);
  if (!Number.isInteger(table) || table < 1 || table > 12) {
    return NextResponse.json({ error: 'Invalid table number' }, { status: 422 });
  }

  let body: { action: TableAction };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const VALID_ACTIONS: TableAction[] = ['deliver', 'bill', 'pay'];
  if (!VALID_ACTIONS.includes(body.action)) {
    return NextResponse.json({ error: 'action must be: deliver | bill | pay' }, { status: 422 });
  }

  const updated =
    body.action === 'deliver' ? deliverTable(table) :
    body.action === 'bill'    ? billTable(table)    :
                                payTable(table);

  return NextResponse.json({ updated: updated.length, orders: updated });
}
