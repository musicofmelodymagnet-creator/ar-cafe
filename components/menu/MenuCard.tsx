'use client';

import { useState } from 'react';
import { Cuboid, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import type { MenuItem } from '@/app/types';
import { useCart } from '@/app/context/CartContext';
import IngredientMap from './IngredientMap';
import dynamic from 'next/dynamic';

const ARFoodViewer = dynamic(() => import('@/components/ar/ARFoodViewer'), {
  ssr: false,
});

interface MenuCardProps {
  item: MenuItem;
}

export default function MenuCard({ item }: MenuCardProps) {
  const { addItem, state } = useCart();
  const [showIngredients, setShowIngredients] = useState(false);
  const [showAR, setShowAR] = useState(false);

  const cartQty = state.items.find(i => i.menuItem.id === item.id)?.quantity ?? 0;

  const handleAddToCart = () => {
    addItem(item);
    setShowAR(false);
  };

  return (
    <>
      <article className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        {/* Image placeholder */}
        <div className="relative h-44 bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
          <div className="text-6xl select-none" aria-hidden>
            {item.category === 'appetizers' && '🥗'}
            {item.category === 'mains' && '🍽️'}
            {item.category === 'desserts' && '🍰'}
            {item.category === 'drinks' && '☕'}
          </div>
          {cartQty > 0 && (
            <div className="absolute top-3 right-3 bg-amber-400 text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">
              {cartQty}
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-zinc-900 text-base leading-tight">{item.name}</h3>
            <span className="font-bold text-amber-600 text-base shrink-0 whitespace-nowrap">
              {item.price} ₽
            </span>
          </div>

          <p className="text-xs text-zinc-400 mb-1">{item.calories} ккал</p>
          <p className="text-sm text-zinc-600 leading-relaxed line-clamp-2">{item.description}</p>

          {/* Ingredients toggle */}
          <button
            onClick={() => setShowIngredients(v => !v)}
            className="flex items-center gap-1 mt-2 text-xs text-zinc-500 hover:text-amber-600 transition-colors"
          >
            {showIngredients ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showIngredients ? 'Скрыть состав' : 'Показать состав'}
          </button>

          {showIngredients && <IngredientMap ingredients={item.ingredients} />}

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowAR(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-700 active:scale-95 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-150"
            >
              <Cuboid size={16} className="shrink-0" />
              <span className="hidden sm:inline">Посмотреть в 3D</span>
              <span className="sm:hidden">3D</span>
            </button>

            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-black text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-150"
            >
              <ShoppingCart size={16} />
              {cartQty === 0 ? (
                <span>В корзину</span>
              ) : (
                <span>+1</span>
              )}
            </button>
          </div>
        </div>
      </article>

      {/* AR Viewer overlay */}
      {showAR && (
        <ARFoodViewer
          item={item}
          onClose={() => setShowAR(false)}
          tableNumber={state.tableNumber}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  );
}
