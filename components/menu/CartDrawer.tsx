'use client';

import { useState } from 'react';
import { ShoppingCart, X, Minus, Plus, Loader2, CheckCircle } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';

const CATEGORY_EMOJI: Record<string, string> = {
  appetizers: '🥗',
  mains: '🍽️',
  desserts: '🍰',
  drinks: '☕',
};

export default function CartDrawer() {
  const { cartItems, totalPrice, totalItems, updateQuantity, removeItem, clearCart, state } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const handleOrder = async () => {
    if (!state.tableNumber) return;
    setIsOrdering(true);
    setOrderError(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: state.tableNumber, items: cartItems, totalPrice }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOrdered(true);
      clearCart();
      setTimeout(() => { setOrdered(false); setIsOpen(false); }, 2500);
    } catch {
      setOrderError('Не удалось отправить заказ. Попробуйте ещё раз.');
    } finally {
      setIsOrdering(false);
    }
  };

  if (totalItems === 0 && !isOpen) return null;

  return (
    <>
      {/* Floating cart pill */}
      {!isOpen && totalItems > 0 && (
        <div className="fixed bottom-6 inset-x-4 z-30">
          <button
            onClick={() => setIsOpen(true)}
            className="
              w-full flex items-center justify-between
              bg-text-primary text-surface-base
              px-5 py-4 rounded-2xl
              shadow-[0_8px_32px_0_oklch(0%_0_0_/_0.25)]
              dark:shadow-[0_8px_32px_0_oklch(0%_0_0_/_0.6)]
              active:scale-[0.98] transition-transform duration-100
            "
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart size={20} />
                <span className="
                  absolute -top-1.5 -right-1.5
                  bg-accent text-accent-fg
                  text-[10px] font-bold
                  w-4.5 h-4.5 min-w-[18px] min-h-[18px] px-1
                  rounded-full flex items-center justify-center
                ">
                  {totalItems}
                </span>
              </div>
              <span className="font-semibold text-[15px]">Корзина</span>
            </div>
            <span className="font-bold text-[15px] text-accent">
              {totalPrice.toLocaleString('ru-RU')} ₽
            </span>
          </button>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-text-primary/30 dark:bg-text-primary/20 z-30 backdrop-blur-[3px]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sheet */}
      <div
        className={`
          fixed inset-x-0 bottom-0 z-40
          bg-surface-raised rounded-t-3xl
          shadow-[0_-4px_40px_0_oklch(0%_0_0_/_0.12)]
          dark:shadow-[0_-4px_40px_0_oklch(0%_0_0_/_0.5)]
          transition-transform duration-300
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ maxHeight: '85dvh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 bg-border-default rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
          <div>
            <h2 className="font-bold text-text-primary text-[18px]">Ваш заказ</h2>
            {state.tableNumber && (
              <p className="text-[12px] text-text-muted">Стол №{state.tableNumber}</p>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="
              w-8 h-8 rounded-full bg-surface-inset
              flex items-center justify-center
              text-text-secondary hover:text-text-primary
              transition-colors
            "
          >
            <X size={16} />
          </button>
        </div>

        {/* Success */}
        {ordered && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 px-5">
            <div className="w-16 h-16 bg-success-subtle rounded-full flex items-center justify-center">
              <CheckCircle size={34} className="text-success" />
            </div>
            <div className="text-center">
              <p className="font-bold text-text-primary text-[20px]">Заказ принят!</p>
              <p className="text-text-secondary text-[14px] mt-1 max-w-[260px]">
                Блюда готовятся и скоро появятся на Столе №{state.tableNumber}
              </p>
            </div>
          </div>
        )}

        {/* Items */}
        {!ordered && (
          <div
            className="overflow-y-auto"
            style={{ maxHeight: 'calc(85dvh - 180px)' }}
          >
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <ShoppingCart size={36} className="text-text-muted opacity-30" />
                <p className="text-[13px] text-text-muted">Корзина пуста</p>
              </div>
            ) : (
              <ul className="px-5 py-4 space-y-3">
                {cartItems.map(({ menuItem, quantity }) => (
                  <li key={menuItem.id} className="flex items-center gap-3">
                    <div className="
                      w-11 h-11 rounded-xl
                      bg-surface-subtle
                      flex items-center justify-center
                      text-[22px] shrink-0
                    ">
                      {CATEGORY_EMOJI[menuItem.category] ?? '🍴'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary text-[14px] truncate">{menuItem.name}</p>
                      <p className="text-[12px] text-text-muted">
                        {menuItem.price.toLocaleString('ru-RU')} ₽
                        {quantity > 1 && ` × ${quantity}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(menuItem.id, quantity - 1)}
                        className="w-7 h-7 rounded-full bg-surface-inset hover:bg-border-subtle flex items-center justify-center text-text-secondary transition-colors"
                        aria-label="Уменьшить"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-5 text-center text-[14px] font-bold text-text-primary tabular-nums">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(menuItem.id, quantity + 1)}
                        className="w-7 h-7 rounded-full bg-surface-inset hover:bg-border-subtle flex items-center justify-center text-text-secondary transition-colors"
                        aria-label="Увеличить"
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        onClick={() => removeItem(menuItem.id)}
                        className="w-7 h-7 rounded-full bg-surface-subtle hover:bg-border-subtle flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors ml-0.5"
                        aria-label="Удалить"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Footer */}
        {!ordered && cartItems.length > 0 && (
          <div className="px-5 pb-8 pt-4 border-t border-border-subtle">
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-[14px] text-text-secondary">Итого</span>
              <span className="font-bold text-[22px] text-text-primary">
                {totalPrice.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            {orderError && (
              <p className="text-[12px] text-center mb-3" style={{ color: 'oklch(58% 0.2 25)' }}>
                {orderError}
              </p>
            )}
            <button
              onClick={handleOrder}
              disabled={isOrdering || !state.tableNumber}
              className="
                w-full bg-accent hover:bg-accent-dim
                disabled:opacity-50 disabled:cursor-not-allowed
                text-accent-fg font-bold
                px-6 py-4 rounded-2xl
                active:scale-[0.98]
                transition-all duration-100
                text-[15px] flex items-center justify-center gap-2
              "
            >
              {isOrdering ? (
                <><Loader2 size={18} className="animate-spin" />Отправка на кухню…</>
              ) : (
                `Заказать на Стол №${state.tableNumber ?? '—'}`
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
