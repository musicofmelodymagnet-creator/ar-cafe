'use client';

import { useState } from 'react';
import { ShoppingCart, X, Minus, Plus, Loader2, CheckCircle } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';

export default function CartDrawer() {
  const { cartItems, totalPrice, totalItems, updateQuantity, removeItem, clearCart, state } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);

  const handleOrder = async () => {
    setIsOrdering(true);
    // Simulate API call to kitchen
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsOrdering(false);
    setOrdered(true);
    clearCart();
    setTimeout(() => {
      setOrdered(false);
      setIsOpen(false);
    }, 2500);
  };

  if (totalItems === 0 && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Floating cart button */}
      {!isOpen && totalItems > 0 && (
        <div className="fixed bottom-6 inset-x-4 z-30">
          <button
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center justify-between bg-zinc-900 text-white px-5 py-4 rounded-2xl shadow-2xl active:scale-[0.98] transition-transform duration-100"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart size={22} />
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              </div>
              <span className="font-semibold">Корзина</span>
            </div>
            <span className="font-bold text-amber-400">{totalPrice.toLocaleString('ru-RU')} ₽</span>
          </button>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 backdrop-blur-[2px]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85dvh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100">
          <div>
            <h2 className="font-bold text-zinc-900 text-lg">Ваш заказ</h2>
            {state.tableNumber && (
              <p className="text-xs text-zinc-500">Стол №{state.tableNumber}</p>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success state */}
        {ordered && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 px-5">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={36} className="text-green-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-zinc-900 text-xl">Заказ принят!</p>
              <p className="text-zinc-500 text-sm mt-1">
                Блюда готовятся и скоро будут поданы на Стол №{state.tableNumber}
              </p>
            </div>
          </div>
        )}

        {/* Items list */}
        {!ordered && (
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(85dvh - 180px)' }}>
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                <ShoppingCart size={40} className="mb-3 opacity-30" />
                <p className="text-sm">Корзина пуста</p>
              </div>
            ) : (
              <ul className="px-5 py-4 space-y-4">
                {cartItems.map(({ menuItem, quantity }) => (
                  <li key={menuItem.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                      {menuItem.category === 'appetizers' && '🥗'}
                      {menuItem.category === 'mains' && '🍽️'}
                      {menuItem.category === 'desserts' && '🍰'}
                      {menuItem.category === 'drinks' && '☕'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 text-sm truncate">{menuItem.name}</p>
                      <p className="text-xs text-zinc-500">{menuItem.price} ₽ × {quantity}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQuantity(menuItem.id, quantity - 1)}
                        className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                        aria-label="Уменьшить"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(menuItem.id, quantity + 1)}
                        className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                        aria-label="Увеличить"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => removeItem(menuItem.id)}
                        className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors ml-1"
                        aria-label="Удалить"
                      >
                        <X size={14} />
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
          <div className="px-5 pb-8 pt-4 border-t border-zinc-100 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-zinc-500 text-sm">Итого</span>
              <span className="font-bold text-xl text-zinc-900">{totalPrice.toLocaleString('ru-RU')} ₽</span>
            </div>
            <button
              onClick={handleOrder}
              disabled={isOrdering}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] text-black font-bold px-6 py-4 rounded-2xl transition-all duration-150 text-base flex items-center justify-center gap-2"
            >
              {isOrdering ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Отправка на кухню…
                </>
              ) : (
                `Оформить заказ для Стола №${state.tableNumber ?? '—'}`
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
