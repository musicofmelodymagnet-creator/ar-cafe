import { NextResponse } from 'next/server';
import { getAllOrders } from '@/app/lib/order-store';
import type { OrderStatus } from '@/app/lib/order-store';

export const dynamic = 'force-dynamic';

const TOTAL_TABLES = 12;

type TableStatus = 'free' | 'new' | 'preparing' | 'ready' | 'served' | 'billed';

function deriveTableStatus(statuses: OrderStatus[]): TableStatus {
  const active = statuses.filter(s => s !== 'paid');
  if (active.length === 0) return 'free';
  if (active.some(s => s === 'billed')) return 'billed';
  if (active.every(s => (['delivered', 'billed', 'paid'] as OrderStatus[]).includes(s))) return 'served';
  if (active.some(s => s === 'ready')) return 'ready';
  if (active.some(s => s === 'preparing')) return 'preparing';
  return 'new';
}

export async function GET() {
  const allOrders = getAllOrders();
  const tables = Array.from({ length: TOTAL_TABLES }, (_, i) => {
    const n = i + 1;
    const tableOrders = allOrders.filter(o => o.tableNumber === n);
    const active = tableOrders.filter(o => o.status !== 'paid');
    return {
      number: n,
      status: deriveTableStatus(tableOrders.map(o => o.status)),
      orderCount: active.length,
      total: active.reduce((s, o) => s + o.totalPrice, 0),
      activeItems: active.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0),
    };
  });
  return NextResponse.json({ tables });
}
