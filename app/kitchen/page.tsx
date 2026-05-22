'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Order, OrderStatus } from '@/app/lib/order-store';

const STATUS_META: Record<OrderStatus, { label: string; color: string; next: OrderStatus | null }> = {
  new:       { label: 'Новый',      color: 'bg-red-500',    next: 'preparing' },
  preparing: { label: 'Готовится',  color: 'bg-amber-400',  next: 'ready'     },
  ready:     { label: 'Готово',     color: 'bg-green-500',  next: 'delivered' },
  delivered: { label: 'Выдан',      color: 'bg-zinc-400',   next: null        },
};

const CATEGORY_EMOJI: Record<string, string> = {
  appetizers: '🥗',
  mains:      '🍽️',
  desserts:   '🍰',
  drinks:     '☕',
};

function OrderCard({ order, onStatusChange }: { order: Order; onStatusChange: (id: string, s: OrderStatus) => void }) {
  const meta = STATUS_META[order.status];
  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);

  const [secs, setSecs] = useState(elapsed);
  useEffect(() => {
    if (order.status === 'delivered') return;
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [order.status]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div
      className={`rounded-2xl border-2 flex flex-col overflow-hidden transition-all duration-300 ${
        order.status === 'new'       ? 'border-red-400 shadow-red-100 shadow-lg' :
        order.status === 'preparing' ? 'border-amber-400 shadow-amber-100 shadow-md' :
        order.status === 'ready'     ? 'border-green-400 shadow-green-100 shadow-md' :
        'border-zinc-200 opacity-60'
      }`}
    >
      {/* Card header */}
      <div className={`${meta.color} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg">{order.id}</span>
          <span className="bg-white/25 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            Стол №{order.tableNumber}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/90 text-sm font-mono">{fmt(secs)}</span>
          <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {meta.label}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 bg-white px-4 py-3 space-y-1.5">
        {order.items.map(({ menuItem, quantity }) => (
          <div key={menuItem.id} className="flex items-center gap-2">
            <span className="text-xl leading-none">{CATEGORY_EMOJI[menuItem.category] ?? '🍴'}</span>
            <span className="flex-1 text-sm font-medium text-zinc-800">{menuItem.name}</span>
            <span className="text-sm font-bold text-zinc-600 tabular-nums">×{quantity}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-zinc-50 border-t border-zinc-100 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          {' · '}{order.totalPrice.toLocaleString('ru-RU')} ₽
        </span>
        {meta.next && (
          <button
            onClick={() => onStatusChange(order.id, meta.next!)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-colors ${
              order.status === 'new'       ? 'bg-amber-500 hover:bg-amber-400' :
              order.status === 'preparing' ? 'bg-green-500 hover:bg-green-400' :
              'bg-zinc-500 hover:bg-zinc-400'
            }`}
          >
            {order.status === 'new'       ? 'Начать готовить →' :
             order.status === 'preparing' ? 'Готово ✓' :
             'Выдан'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/orders/stream');
    esRef.current = es;

    es.onopen = () => { setConnected(true); setError(null); };
    es.onerror = () => { setConnected(false); setError('Нет соединения с сервером'); };

    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(e.data) as
          | { type: 'snapshot'; orders: Order[] }
          | { type: 'order_created'; order: Order }
          | { type: 'order_updated'; order: Order };

        if (payload.type === 'snapshot') {
          setOrders(payload.orders);
        } else if (payload.type === 'order_created') {
          setOrders(prev => [payload.order, ...prev]);
        } else if (payload.type === 'order_updated') {
          setOrders(prev => prev.map(o => o.id === payload.order.id ? payload.order : o));
        }
      } catch { /* malformed event */ }
    };

    return () => { es.close(); };
  }, []);

  const handleStatusChange = useCallback(async (id: string, status: OrderStatus) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    // SSE will update state automatically via order_updated event
  }, []);

  const active   = orders.filter(o => o.status !== 'delivered');
  const newCount = orders.filter(o => o.status === 'new').length;

  return (
    <div className="min-h-dvh bg-zinc-900 text-white flex flex-col">
      {/* KDS Header */}
      <header className="bg-zinc-800 border-b border-zinc-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">K</span>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Кухонный экран</h1>
            <p className="text-xs text-zinc-400">Kitchen Display System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {newCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500 px-3 py-1 rounded-full animate-pulse">
              <span className="text-sm font-bold">{newCount}</span>
              <span className="text-xs">новых</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-500'}`} />
            <span className="text-xs text-zinc-400">{connected ? 'Онлайн' : 'Офлайн'}</span>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-800 px-6 py-2 text-red-300 text-sm">
          {error} — переподключение…
        </div>
      )}

      {/* Columns: New | Preparing | Ready */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-zinc-700 overflow-auto">
        {(['new', 'preparing', 'ready'] as OrderStatus[]).map(status => {
          const col = active.filter(o => o.status === status);
          const meta = STATUS_META[status];
          return (
            <div key={status} className="flex flex-col min-h-0">
              <div className={`${meta.color} px-4 py-2 flex items-center gap-2`}>
                <span className="font-bold text-white">{meta.label}</span>
                <span className="bg-white/20 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {col.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-zinc-900">
                {col.length === 0 ? (
                  <p className="text-zinc-600 text-sm text-center py-8">Нет заказов</p>
                ) : (
                  col.map(order => (
                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivered log (collapsed at bottom) */}
      {orders.some(o => o.status === 'delivered') && (
        <div className="border-t border-zinc-700 px-6 py-2 bg-zinc-800">
          <p className="text-xs text-zinc-500">
            Выданные сегодня: {orders.filter(o => o.status === 'delivered').length} заказов
          </p>
        </div>
      )}
    </div>
  );
}
