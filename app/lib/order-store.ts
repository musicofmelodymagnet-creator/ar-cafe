/**
 * In-memory order store shared across Route Handler invocations.
 * In production replace with Redis / Supabase / Postgres.
 * Module-level singleton persists for the lifetime of the Next.js process.
 */

import type { CartItem } from '@/app/types';

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'delivered';

export interface Order {
  id: string;
  tableNumber: number;
  items: CartItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: string; // ISO
  updatedAt: string;
}

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
};

// Module-level singletons
const orders = new Map<string, Order>();
const clients = new Set<SSEClient>();

let counter = 1;

export function createOrder(tableNumber: number, items: CartItem[], totalPrice: number): Order {
  const id = `ORD-${String(counter++).padStart(4, '0')}`;
  const now = new Date().toISOString();
  const order: Order = { id, tableNumber, items, totalPrice, status: 'new', createdAt: now, updatedAt: now };
  orders.set(id, order);
  broadcast({ type: 'order_created', order });
  return order;
}

export function updateOrderStatus(id: string, status: OrderStatus): Order | null {
  const order = orders.get(id);
  if (!order) return null;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  broadcast({ type: 'order_updated', order });
  return order;
}

export function getAllOrders(): Order[] {
  return [...orders.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// SSE broadcast helpers
const encoder = new TextEncoder();

export function addSSEClient(client: SSEClient) {
  clients.add(client);
}

export function removeSSEClient(client: SSEClient) {
  clients.delete(client);
}

function broadcast(payload: unknown) {
  const msg = encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
  for (const client of clients) {
    try {
      client.controller.enqueue(msg);
    } catch {
      clients.delete(client);
    }
  }
}
