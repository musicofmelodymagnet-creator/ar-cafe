'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { MENU_ITEMS, CATEGORIES } from '@/app/data/menu';
import type { MenuCategory } from '@/app/types';
import CategoryTabs from '@/components/menu/CategoryTabs';
import MenuCard from '@/components/menu/MenuCard';
import CartDrawer from '@/components/menu/CartDrawer';
import { CartProvider } from '@/app/context/CartContext';
import { Suspense } from 'react';

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
    () =>
      CATEGORIES.reduce(
        (acc, { id }) => ({ ...acc, [id]: MENU_ITEMS.filter(i => i.category === id).length }),
        {} as Record<MenuCategory, number>
      ),
    []
  );

  return (
    <CartProvider tableNumber={tableNumber}>
      <div className="min-h-dvh bg-zinc-50 flex flex-col">
        {/* App header */}
        <header className="bg-white px-4 pt-safe-area-inset-top pt-4 pb-4 border-b border-zinc-100">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div>
              <h1 className="font-bold text-zinc-900 text-xl tracking-tight">AR Кафе</h1>
              {tableNumber !== null ? (
                <p className="text-xs text-zinc-500">Стол №{tableNumber}</p>
              ) : (
                <p className="text-xs text-zinc-400">Откройте QR-код на столике</p>
              )}
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center">
              <span className="text-black font-bold text-sm" aria-hidden>AR</span>
            </div>
          </div>
        </header>

        {/* Category tabs */}
        <CategoryTabs
          active={activeCategory}
          onChange={setActiveCategory}
          counts={counts}
        />

        {/* Menu items grid */}
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 pb-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        </main>

        {/* Cart drawer */}
        <CartDrawer />
      </div>
    </CartProvider>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-zinc-50 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
