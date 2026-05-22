'use client';

import { useMemo } from 'react';
import { X, Loader2, CreditCard } from 'lucide-react';
import type { Order } from '@/app/lib/order-store';
import type { CartItem } from '@/app/types';

interface BillSheetProps {
  tableNumber: number;
  orders: Order[];
  onPay: () => Promise<void>;
  onClose: () => void;
  payLoading: boolean;
}

export default function BillSheet({ tableNumber, orders, onPay, onClose, payLoading }: BillSheetProps) {
  const billItems = useMemo(() => {
    const relevant = orders.filter(o => ['delivered', 'billed'].includes(o.status));
    const merged: CartItem[] = [];
    for (const order of relevant) {
      for (const { menuItem, quantity } of order.items) {
        const existing = merged.find(i => i.menuItem.id === menuItem.id);
        if (existing) existing.quantity += quantity;
        else merged.push({ menuItem, quantity });
      }
    }
    return merged;
  }, [orders]);

  const total = billItems.reduce((s, { menuItem, quantity }) => s + menuItem.price * quantity, 0);

  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div
        className="fixed inset-0 bg-text-primary/30 dark:bg-text-primary/20 z-40 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-surface-raised rounded-t-3xl shadow-[0_-4px_40px_0_oklch(0%_0_0_/_0.2)] flex flex-col"
        style={{ maxHeight: '92dvh' }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 bg-border-default rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle shrink-0">
          <div>
            <h2 className="font-bold text-text-primary text-[18px]">Счёт</h2>
            <p className="text-[12px] text-text-muted">Стол №{tableNumber} · {dateStr}, {timeStr}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-inset flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Restaurant header */}
          <div className="px-5 py-5 border-b border-dashed border-border-default text-center">
            <p className="text-[11px] font-black tracking-[0.2em] uppercase text-accent">AR КАФЕ</p>
            <p className="text-[12px] text-text-muted mt-1">Спасибо, что выбрали нас!</p>
          </div>

          {/* Items */}
          <ul className="px-5 py-4 space-y-3">
            {billItems.map(({ menuItem, quantity }) => (
              <li key={menuItem.id} className="flex items-baseline gap-2">
                <span className="flex-1 text-[14px] text-text-primary font-medium leading-snug">
                  {menuItem.name}
                </span>
                {quantity > 1 && (
                  <span className="text-[12px] text-text-muted shrink-0 tabular-nums">×{quantity}</span>
                )}
                <span className="text-[14px] font-semibold text-text-primary tabular-nums shrink-0">
                  {(menuItem.price * quantity).toLocaleString('ru-RU')} ₽
                </span>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="mx-5 border-t-2 border-dashed border-border-default" />

          {/* Total */}
          <div className="px-5 py-5 flex justify-between items-baseline">
            <span className="text-[15px] font-bold text-text-primary tracking-wide">ИТОГО</span>
            <span className="text-[30px] font-black text-text-primary tabular-nums leading-none">
              {total.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>

        <div className="px-5 pb-8 pt-4 border-t border-border-subtle shrink-0">
          <button
            onClick={onPay}
            disabled={payLoading}
            className="
              w-full bg-success hover:bg-success/90 disabled:opacity-50
              text-white font-bold px-6 py-4 rounded-2xl
              active:scale-[0.98] transition-all duration-100
              text-[15px] flex items-center justify-center gap-2
            "
          >
            {payLoading
              ? <><Loader2 size={18} className="animate-spin" />Закрытие стола…</>
              : <><CreditCard size={18} />Принято оплатой — закрыть стол</>}
          </button>
        </div>
      </div>
    </>
  );
}
