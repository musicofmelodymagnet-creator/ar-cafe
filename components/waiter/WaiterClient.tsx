'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Plus, Utensils, Receipt, Check,
  Wifi, WifiOff, Clock,
} from 'lucide-react';
import type { Order, OrderStatus } from '@/app/lib/order-store';
import ManualOrderSheet from './ManualOrderSheet';
import BillSheet from './BillSheet';

const TOTAL_TABLES = 12;

type TableStatus = 'free' | 'new' | 'preparing' | 'ready' | 'served' | 'billed';

type SSEPayload =
  | { type: 'snapshot'; orders: Order[] }
  | { type: 'order_created'; order: Order }
  | { type: 'order_updated'; order: Order };

function deriveTableStatus(tableOrders: Order[]): TableStatus {
  const active = tableOrders.filter(o => o.status !== 'paid');
  if (active.length === 0) return 'free';
  if (active.some(o => o.status === 'billed')) return 'billed';
  if (active.every(o => (['delivered', 'billed', 'paid'] as OrderStatus[]).includes(o.status))) return 'served';
  if (active.some(o => o.status === 'ready')) return 'ready';
  if (active.some(o => o.status === 'preparing')) return 'preparing';
  return 'new';
}

const STATUS_CONFIG: Record<TableStatus, {
  label: string;
  dotClass: string;
  cardClass: string;
  badgeClass: string;
}> = {
  free:      { label: 'Свободен',  dotClass: 'bg-border-default',                     cardClass: 'bg-surface-inset border-border-subtle',                                    badgeClass: 'text-text-muted' },
  new:       { label: 'Новый',     dotClass: 'bg-accent animate-pulse',                cardClass: 'bg-accent-subtle border-accent/60',                                        badgeClass: 'text-accent-fg bg-accent/20' },
  preparing: { label: 'Готовится', dotClass: 'bg-status-preparing-border',             cardClass: 'bg-status-preparing-bg border-status-preparing-border',                   badgeClass: 'text-status-preparing-fg bg-status-preparing-border/20' },
  ready:     { label: 'Готово!',   dotClass: 'bg-success animate-pulse',               cardClass: 'bg-success-subtle border-success/60',                                      badgeClass: 'text-success bg-success/20' },
  served:    { label: 'Подано',    dotClass: 'bg-text-muted',                          cardClass: 'bg-surface-raised border-border-default',                                  badgeClass: 'text-text-secondary bg-surface-inset' },
  billed:    { label: 'Счёт',      dotClass: 'bg-status-billed-border animate-pulse',  cardClass: 'bg-status-billed-bg border-status-billed-border',                         badgeClass: 'text-status-billed-fg bg-status-billed-border/20' },
};

const ORDER_STATUS_META: Record<OrderStatus, { label: string; cls: string }> = {
  new:       { label: 'Новый',     cls: 'bg-accent/15 text-accent-fg' },
  preparing: { label: 'Готовится', cls: 'bg-status-preparing-border/15 text-status-preparing-fg' },
  ready:     { label: 'Готово!',   cls: 'bg-success/15 text-success' },
  delivered: { label: 'Подано',    cls: 'bg-surface-inset text-text-muted' },
  billed:    { label: 'В счёте',   cls: 'bg-status-billed-border/15 text-status-billed-fg' },
  paid:      { label: 'Оплачен',   cls: 'bg-surface-inset text-text-muted' },
};

const CAT_EMOJI: Record<string, string> = {
  appetizers: '🥗', mains: '🍽️', desserts: '🍰', drinks: '☕',
};

export default function WaiterClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [showOrderSheet, setShowOrderSheet] = useState(false);
  const [showBillSheet, setShowBillSheet] = useState(false);
  const [actionLoading, setActionLoading] = useState<'deliver' | 'bill' | 'pay' | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/orders/stream');
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const p = JSON.parse(e.data) as SSEPayload;
        if (p.type === 'snapshot') setOrders(p.orders);
        else if (p.type === 'order_created') setOrders(prev => [p.order, ...prev]);
        else if (p.type === 'order_updated') setOrders(prev => prev.map(o => o.id === p.order.id ? p.order : o));
      } catch { /* malformed event */ }
    };
    return () => es.close();
  }, []);

  const tableData = useMemo(() => {
    const result: Record<number, {
      status: TableStatus;
      orders: Order[];
      total: number;
      activeItems: number;
    }> = {};
    for (let t = 1; t <= TOTAL_TABLES; t++) {
      const tOrders = orders.filter(o => o.tableNumber === t);
      const active = tOrders.filter(o => o.status !== 'paid');
      result[t] = {
        status: deriveTableStatus(tOrders),
        orders: tOrders,
        total: active.reduce((s, o) => s + o.totalPrice, 0),
        activeItems: active.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0),
      };
    }
    return result;
  }, [orders]);

  const doAction = useCallback(async (table: number, action: 'deliver' | 'bill' | 'pay') => {
    setActionLoading(action);
    try {
      await fetch(`/api/tables/${table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    } finally {
      setActionLoading(null);
    }
  }, []);

  const goBack = useCallback(() => {
    setSelectedTable(null);
    setShowOrderSheet(false);
    setShowBillSheet(false);
  }, []);

  const currentData = selectedTable ? tableData[selectedTable] : null;
  const activeOrders = useMemo(
    () => currentData?.orders.filter(o => o.status !== 'paid') ?? [],
    [currentData]
  );
  const hasReady = activeOrders.some(o => o.status === 'ready');
  const allDone = activeOrders.length > 0 &&
    activeOrders.every(o => (['delivered', 'billed', 'paid'] as OrderStatus[]).includes(o.status));
  const hasBilled = activeOrders.some(o => o.status === 'billed');

  return (
    <div className="min-h-dvh bg-surface-base flex flex-col relative overflow-hidden">

      {/* ── Grid panel ─────────────────────────────────────────────────────── */}
      <div className={`
        absolute inset-0 flex flex-col
        transition-transform duration-[250ms] ease-out
        ${selectedTable !== null ? '-translate-x-full' : 'translate-x-0'}
      `}>
        <header className="bg-surface-raised border-b border-border-subtle px-4 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-accent">AR КАФЕ</p>
              <h1 className="text-[22px] font-black text-text-primary leading-tight">Официант</h1>
            </div>
            <div className="flex items-center gap-1.5">
              {connected
                ? <Wifi size={14} className="text-success" />
                : <WifiOff size={14} className="text-text-muted" />}
              <span className={`text-[11px] font-semibold ${connected ? 'text-success' : 'text-text-muted'}`}>
                {connected ? 'Live' : 'Офлайн'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-8">
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map(t => {
              const d = tableData[t];
              const cfg = STATUS_CONFIG[d.status];
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTable(t)}
                  className={`
                    rounded-2xl border-2 p-3 text-left flex flex-col gap-1.5
                    transition-all duration-150 active:scale-[0.96]
                    ${cfg.cardClass}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[28px] font-black text-text-primary leading-none">{t}</span>
                    <div className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${cfg.dotClass}`} />
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full self-start ${cfg.badgeClass}`}>
                    {cfg.label}
                  </span>
                  {d.status !== 'free' && (
                    <div className="mt-0.5">
                      <p className="text-[12px] font-bold text-text-primary tabular-nums">
                        {d.total.toLocaleString('ru-RU')} ₽
                      </p>
                      <p className="text-[10px] text-text-muted">{d.activeItems} поз.</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5">
            {(Object.entries(STATUS_CONFIG) as [TableStatus, typeof STATUS_CONFIG[TableStatus]][]).map(([s, cfg]) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${cfg.dotClass.split(' ')[0]}`} />
                <span className="text-[10px] text-text-muted">{cfg.label}</span>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* ── Table detail panel ──────────────────────────────────────────────── */}
      <div className={`
        absolute inset-0 flex flex-col
        transition-transform duration-[250ms] ease-out
        ${selectedTable !== null ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {selectedTable !== null && (
          <>
            <header className="bg-surface-raised border-b border-border-subtle px-4 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={goBack}
                  className="w-9 h-9 rounded-full bg-surface-inset flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors shrink-0"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-accent">СТОЛ</p>
                  <h2 className="text-[22px] font-black text-text-primary leading-tight">{selectedTable}</h2>
                </div>
                {currentData && currentData.status !== 'free' && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${STATUS_CONFIG[currentData.status].badgeClass}`}>
                    {STATUS_CONFIG[currentData.status].label}
                  </span>
                )}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-52">
              {activeOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Utensils size={32} className="text-text-muted opacity-30" />
                  <p className="text-[13px] text-text-muted">Нет активных заказов</p>
                  <p className="text-[12px] text-text-muted">Нажмите «Принять заказ» ниже</p>
                </div>
              ) : (
                activeOrders.map(order => {
                  const meta = ORDER_STATUS_META[order.status];
                  const mins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                  return (
                    <div key={order.id} className="bg-surface-raised rounded-2xl border border-border-subtle overflow-hidden">
                      <div className="px-4 py-2.5 flex items-center justify-between border-b border-border-subtle bg-surface-subtle">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-text-muted">{order.id}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.cls}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-text-muted">
                          <Clock size={11} />
                          <span className="text-[11px]">{mins > 0 ? `${mins} мин` : 'только что'}</span>
                        </div>
                      </div>
                      <div className="px-4 py-3 space-y-2">
                        {order.items.map(({ menuItem, quantity }) => (
                          <div key={menuItem.id} className="flex items-center gap-2">
                            <span className="text-[15px]">{CAT_EMOJI[menuItem.category] ?? '🍴'}</span>
                            <span className="flex-1 text-[13px] text-text-primary font-medium truncate">{menuItem.name}</span>
                            <span className="text-[12px] text-text-muted tabular-nums shrink-0">×{quantity}</span>
                            <span className="text-[12px] font-semibold text-text-secondary tabular-nums shrink-0 ml-1">
                              {(menuItem.price * quantity).toLocaleString('ru-RU')} ₽
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-2.5 bg-surface-subtle border-t border-border-subtle flex justify-end">
                        <span className="text-[13px] font-bold text-text-primary">
                          {order.totalPrice.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action bar */}
            <div className="absolute bottom-0 inset-x-0 bg-surface-raised/95 backdrop-blur-sm border-t border-border-subtle px-4 pt-4 pb-8 space-y-2.5">
              <button
                onClick={() => setShowOrderSheet(true)}
                className="w-full flex items-center justify-center gap-2 bg-surface-inset hover:bg-border-subtle text-text-primary font-semibold py-3.5 rounded-2xl transition-colors text-[14px]"
              >
                <Plus size={16} />
                Принять заказ вручную
              </button>

              {hasReady && (
                <button
                  onClick={() => doAction(selectedTable, 'deliver')}
                  disabled={actionLoading === 'deliver'}
                  className="w-full flex items-center justify-center gap-2 bg-success hover:bg-success/90 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-colors text-[14px]"
                >
                  <Check size={16} />
                  {actionLoading === 'deliver' ? 'Подтверждение…' : 'Блюда поданы на стол'}
                </button>
              )}

              {allDone && !hasBilled && (
                <button
                  onClick={async () => {
                    await doAction(selectedTable, 'bill');
                    setShowBillSheet(true);
                  }}
                  disabled={actionLoading === 'bill'}
                  className="w-full flex items-center justify-center gap-2 bg-text-primary hover:bg-text-secondary disabled:opacity-50 text-surface-base font-bold py-3.5 rounded-2xl transition-colors text-[14px]"
                >
                  <Receipt size={16} />
                  {actionLoading === 'bill' ? 'Формируется…' : 'Выставить счёт'}
                </button>
              )}

              {hasBilled && (
                <button
                  onClick={() => setShowBillSheet(true)}
                  className="w-full flex items-center justify-center gap-2 bg-text-primary text-surface-base font-bold py-3.5 rounded-2xl text-[14px]"
                >
                  <Receipt size={16} />
                  Показать счёт
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Sheets ─────────────────────────────────────────────────────────── */}
      {showOrderSheet && selectedTable !== null && (
        <ManualOrderSheet
          tableNumber={selectedTable}
          onClose={() => setShowOrderSheet(false)}
        />
      )}
      {showBillSheet && selectedTable !== null && (
        <BillSheet
          tableNumber={selectedTable}
          orders={activeOrders}
          onPay={async () => {
            await doAction(selectedTable, 'pay');
            setShowBillSheet(false);
            setSelectedTable(null);
          }}
          onClose={() => setShowBillSheet(false)}
          payLoading={actionLoading === 'pay'}
        />
      )}
    </div>
  );
}
