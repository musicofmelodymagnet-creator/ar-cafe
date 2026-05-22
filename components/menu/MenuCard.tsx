'use client';

import { useState } from 'react';
import { Cuboid, ShoppingCart, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import type { MenuItem, MenuCategory } from '@/app/types';
import { useCart } from '@/app/context/CartContext';
import IngredientMap from './IngredientMap';
import dynamic from 'next/dynamic';

const ARFoodViewer = dynamic(() => import('@/components/ar/ARFoodViewer'), { ssr: false });

const CATEGORY_META: Record<MenuCategory, { bg: string; emoji: string }> = {
  appetizers: { bg: 'var(--cat-appetizers)', emoji: '🥗' },
  mains:      { bg: 'var(--cat-mains)',       emoji: '🍽️' },
  desserts:   { bg: 'var(--cat-desserts)',     emoji: '🍰' },
  drinks:     { bg: 'var(--cat-drinks)',       emoji: '☕' },
};

interface MenuCardProps {
  item: MenuItem;
}

export default function MenuCard({ item }: MenuCardProps) {
  const { addItem, state } = useCart();
  const [showIngredients, setShowIngredients] = useState(false);
  const [showAR, setShowAR] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const cartQty = state.items.find(i => i.menuItem.id === item.id)?.quantity ?? 0;
  const meta = CATEGORY_META[item.category];

  const handleAddToCart = () => {
    addItem(item);
    setShowAR(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 600);
  };

  return (
    <>
      <article className="
        bg-surface-raised rounded-2xl overflow-hidden
        shadow-[0_1px_4px_0_oklch(0%_0_0_/_0.06),0_4px_16px_0_oklch(0%_0_0_/_0.04)]
        dark:shadow-[0_1px_4px_0_oklch(0%_0_0_/_0.4),0_4px_16px_0_oklch(0%_0_0_/_0.3)]
        hover:shadow-[0_2px_8px_0_oklch(0%_0_0_/_0.08),0_8px_24px_0_oklch(0%_0_0_/_0.06)]
        dark:hover:shadow-[0_2px_8px_0_oklch(0%_0_0_/_0.5),0_8px_24px_0_oklch(0%_0_0_/_0.4)]
        transition-shadow duration-200
      ">
        {/* Image area — category tint */}
        <div
          className="relative h-36 flex items-center justify-center"
          style={{ backgroundColor: meta.bg }}
        >
          <span className="text-[56px] select-none leading-none" role="img" aria-label={item.category}>
            {meta.emoji}
          </span>

          {/* Price tag — top right corner */}
          <div className="
            absolute top-0 right-0
            bg-accent text-accent-fg
            text-[13px] font-bold
            px-3 py-1
            rounded-bl-xl rounded-tr-xl
          ">
            {item.price.toLocaleString('ru-RU')} ₽
          </div>

          {/* Cart qty badge */}
          {cartQty > 0 && (
            <div className="
              absolute top-2.5 left-3
              bg-surface-raised text-text-primary
              text-[11px] font-bold
              w-6 h-6 rounded-full
              flex items-center justify-center
              shadow-sm
            ">
              {cartQty}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pt-3.5 pb-4">
          {/* Name + meta */}
          <h3 className="text-[17px] font-bold text-text-primary leading-[1.2] tracking-tight">
            {item.name}
          </h3>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted mt-1">
            {item.calories}&nbsp;ккал
          </p>

          {/* Description */}
          <p className="text-[13px] text-text-secondary leading-relaxed mt-2 line-clamp-3">
            {item.description}
          </p>

          {/* Ingredient toggle */}
          <button
            onClick={() => setShowIngredients(v => !v)}
            className="
              flex items-center gap-1 mt-2.5
              text-[12px] font-medium text-text-muted
              hover:text-accent transition-colors duration-150
            "
          >
            {showIngredients
              ? <><ChevronUp size={13} /> Скрыть состав</>
              : <><ChevronDown size={13} /> Состав и происхождение</>
            }
          </button>

          {showIngredients && (
            <div className="mt-2">
              <IngredientMap ingredients={item.ingredients} />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4">
            {/* AR — primary CTA */}
            <button
              onClick={() => setShowAR(true)}
              className="
                flex-1 flex items-center justify-center gap-2
                bg-text-primary text-surface-base
                text-[13px] font-semibold
                px-4 py-2.5 rounded-xl
                active:scale-[0.96]
                transition-all duration-100
              "
            >
              <Cuboid size={15} className="shrink-0" />
              Посмотреть в 3D
            </button>

            {/* Cart — secondary */}
            <button
              onClick={handleAddToCart}
              aria-label="Добавить в корзину"
              className={`
                flex items-center justify-center gap-1.5
                text-accent-fg text-[13px] font-bold
                px-3.5 py-2.5 rounded-xl shrink-0
                active:scale-[0.93]
                transition-all duration-100
                ${justAdded
                  ? 'bg-accent-dim scale-[0.93]'
                  : 'bg-accent hover:bg-accent-dim'
                }
              `}
            >
              {cartQty === 0
                ? <ShoppingCart size={16} />
                : <><Plus size={14} /><span className="tabular-nums">{cartQty}</span></>
              }
            </button>
          </div>
        </div>
      </article>

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
