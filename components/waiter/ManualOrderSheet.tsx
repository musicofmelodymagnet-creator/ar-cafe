'use client';

import { useState, useMemo } from 'react';
import { X, Plus, Minus, ChefHat, Loader2 } from 'lucide-react';
import { MENU_ITEMS, CATEGORIES } from '@/app/data/menu';
import type { MenuCategory } from '@/app/types';

interface ManualOrderSheetProps {
  tableNumber: number;
  onClose: () => void;
}

export default function ManualOrderSheet({ tableNumber, onClose }: ManualOrderSheetProps) {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('appetizers');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setQty = (id: string, qty: number) => {
    setQuantities(prev => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: qty };
    });
  };

  const selectedItems = useMemo(() =>
    MENU_ITEMS
      .filter(item => (quantities[item.id] ?? 0) > 0)
      .map(item => ({ menuItem: item, quantity: quantities[item.id] })),
    [quantities]
  );

  const totalPrice = selectedItems.reduce((s, { menuItem, quantity }) => s + menuItem.price * quantity, 0);
  const totalItems = selectedItems.reduce((s, { quantity }) => s + quantity, 0);

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, items: selectedItems, totalPrice }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitted(true);
      setTimeout(onClose, 1800);
    } catch {
      setError('Не удалось отправить заказ. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryItems = MENU_ITEMS.filter(i => i.category === activeCategory);

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
            <h2 className="font-bold text-text-primary text-[18px]">Принять заказ</h2>
            <p className="text-[12px] text-text-muted">Стол №{tableNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-inset flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 px-5">
            <div className="w-16 h-16 bg-success-subtle rounded-full flex items-center justify-center">
              <ChefHat size={32} className="text-success" />
            </div>
            <div className="text-center">
              <p className="font-bold text-text-primary text-[20px]">Отправлено на кухню!</p>
              <p className="text-text-secondary text-[13px] mt-1">
                {totalItems} поз. · {totalPrice.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Category tabs */}
            <div className="flex border-b border-border-subtle px-2 shrink-0">
              {CATEGORIES.map(cat => {
                const hasItems = MENU_ITEMS.some(i => i.category === cat.id && (quantities[i.id] ?? 0) > 0);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`
                      flex-1 py-3 text-[13px] font-semibold transition-colors relative
                      ${activeCategory === cat.id ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}
                    `}
                  >
                    {cat.label}
                    {hasItems && (
                      <span className="absolute top-2 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
                    )}
                    {activeCategory === cat.id && (
                      <span className="absolute bottom-0 inset-x-2 h-0.5 bg-accent rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              <ul className="px-5 divide-y divide-border-subtle">
                {categoryItems.map(item => {
                  const qty = quantities[item.id] ?? 0;
                  return (
                    <li key={item.id} className="flex items-center gap-3 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-text-primary truncate">{item.name}</p>
                        <p className="text-[12px] text-text-muted">{item.price.toLocaleString('ru-RU')} ₽</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {qty > 0 ? (
                          <>
                            <button
                              onClick={() => setQty(item.id, qty - 1)}
                              className="w-7 h-7 rounded-full bg-surface-inset hover:bg-border-subtle flex items-center justify-center text-text-secondary transition-colors"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-5 text-center text-[14px] font-bold text-text-primary tabular-nums">
                              {qty}
                            </span>
                            <button
                              onClick={() => setQty(item.id, qty + 1)}
                              className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-accent-fg transition-colors"
                            >
                              <Plus size={13} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setQty(item.id, 1)}
                            className="w-7 h-7 rounded-full bg-surface-inset hover:bg-accent hover:text-accent-fg flex items-center justify-center text-text-secondary transition-colors"
                          >
                            <Plus size={13} />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Footer */}
            <div className="px-5 pb-8 pt-4 border-t border-border-subtle shrink-0">
              {totalItems === 0 ? (
                <p className="text-center text-[13px] text-text-muted py-1">Выберите блюда из меню</p>
              ) : (
                <>
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="text-[13px] text-text-secondary">{totalItems} позиций</span>
                    <span className="font-bold text-[20px] text-text-primary tabular-nums">
                      {totalPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  {error && (
                    <p className="text-[12px] text-center mb-3" style={{ color: 'oklch(58% 0.2 25)' }}>
                      {error}
                    </p>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="
                      w-full bg-accent hover:bg-accent-dim disabled:opacity-50
                      text-accent-fg font-bold px-6 py-4 rounded-2xl
                      active:scale-[0.98] transition-all duration-100
                      text-[15px] flex items-center justify-center gap-2
                    "
                  >
                    {submitting
                      ? <><Loader2 size={18} className="animate-spin" />Отправка…</>
                      : 'Отправить на кухню'}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
