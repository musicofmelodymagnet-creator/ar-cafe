'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MENU_ITEMS, CATEGORIES } from '@/app/data/menu';
import type { MenuCategory } from '@/app/types';
import CategoryTabs from '@/components/menu/CategoryTabs';
import MenuCard from '@/components/menu/MenuCard';
import CartDrawer from '@/components/menu/CartDrawer';
import ThemeToggle from '@/components/menu/ThemeToggle';
import { CartProvider } from '@/app/context/CartContext';

function MenuContent() {
  const searchParams = useSearchParams();
  const rawTable = searchParams.get('table');
  const tableNumber = rawTable !== null && !isNaN(Number(rawTable)) ? Number(rawTable) : null;

  const [activeCategory, setActiveCategory] = useState<MenuCategory>('appetizers');

  const filteredItems = useMemo(
    () => MENU_ITEMS.filter(item => item.category === activeCategory),
    [activeCategory]
  );

  const counts = useMemo(
    () => CATEGORIES.reduce(
      (acc, { id }) => ({ ...acc, [id]: MENU_ITEMS.filter(i => i.category === id).length }),
      {} as Record<MenuCategory, number>
    ),
    []
  );

  return (
    <CartProvider tableNumber={tableNumber}>
      <div className="min-h-dvh bg-surface-base flex flex-col">

        {/* Header */}
        <header className="bg-surface-raised border-b border-border-subtle px-4 pt-5 pb-4">
          <div className="flex items-start justify-between max-w-2xl mx-auto">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-accent">AR MENU</span>
                {tableNumber !== null && (
                  <span className="text-[10px] font-semibold text-text-muted tracking-wide">
                    · Стол&nbsp;{tableNumber}
                  </span>
                )}
              </div>
              <h1 className="text-[24px] font-bold tracking-tight text-text-primary leading-tight mt-0.5">
                Добро пожаловать
              </h1>
              <p className="text-[13px] text-text-secondary mt-0.5">
                {tableNumber !== null
                  ? 'Нажмите «3D» чтобы увидеть блюдо на столе'
                  : 'Откройте QR-код на вашем столике'}
              </p>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Category tabs */}
        <CategoryTabs
          active={activeCategory}
          onChange={setActiveCategory}
          counts={counts}
        />

        {/* Menu grid */}
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.map(item => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        </main>

        <CartDrawer />
      </div>
    </CartProvider>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-surface-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/25 border-t-accent rounded-full animate-spin" />
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
