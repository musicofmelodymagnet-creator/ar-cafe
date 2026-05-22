/**
 * In-memory order store shared across Route Handler invocations.
 * In production replace with Redis / Supabase / Postgres.
 *
 * Uses globalThis to guarantee a single instance across all Next.js
 * module contexts (Turbopack creates separate contexts per route handler).
 */

import type { CartItem } from '@/app/types';

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'delivered' | 'billed' | 'paid';

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

// Attach to globalThis so all route handler module contexts share one instance
type Store = {
  orders: Map<string, Order>;
  clients: Set<SSEClient>;
  counter: number;
};

const g = globalThis as typeof globalThis & { __cafeStore?: Store };
if (!g.__cafeStore) {
  g.__cafeStore = {
    orders: new Map<string, Order>(),
    clients: new Set<SSEClient>(),
    counter: 1,
  };
}
const store = g.__cafeStore;

export function createOrder(tableNumber: number, items: CartItem[], totalPrice: number): Order {
  const id = `ORD-${String(store.counter++).padStart(4, '0')}`;
  const now = new Date().toISOString();
  const order: Order = { id, tableNumber, items, totalPrice, status: 'new', createdAt: now, updatedAt: now };
  store.orders.set(id, order);
  broadcast({ type: 'order_created', order });
  return order;
}

export function updateOrderStatus(id: string, status: OrderStatus): Order | null {
  const order = store.orders.get(id);
  if (!order) return null;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  broadcast({ type: 'order_updated', order });
  return order;
}

export function getOrdersByTable(table: number): Order[] {
  return [...store.orders.values()].filter(o => o.tableNumber === table);
}

export function deliverTable(table: number): Order[] {
  return getOrdersByTable(table)
    .filter(o => o.status === 'ready')
    .map(o => updateOrderStatus(o.id, 'delivered')!);
}

export function billTable(table: number): Order[] {
  return getOrdersByTable(table)
    .filter(o => o.status === 'delivered')
    .map(o => updateOrderStatus(o.id, 'billed')!);
}

export function payTable(table: number): Order[] {
  return getOrdersByTable(table)
    .filter(o => o.status === 'billed')
    .map(o => updateOrderStatus(o.id, 'paid')!);
}

export function getAllOrders(): Order[] {
  return [...store.orders.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// SSE broadcast helpers
const encoder = new TextEncoder();

export function addSSEClient(client: SSEClient) {
  store.clients.add(client);
}

export function removeSSEClient(client: SSEClient) {
  store.clients.delete(client);
}

function broadcast(payload: unknown) {
  const msg = encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
  for (const client of store.clients) {
    try {
      client.controller.enqueue(msg);
    } catch {
      store.clients.delete(client);
    }
  }
}
