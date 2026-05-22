'use client';

import type { MenuCategory } from '@/app/types';
import { CATEGORIES } from '@/app/data/menu';

interface CategoryTabsProps {
  active: MenuCategory;
  onChange: (cat: MenuCategory) => void;
  counts: Record<MenuCategory, number>;
}

export default function CategoryTabs({ active, onChange, counts }: CategoryTabsProps) {
  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-zinc-100 px-4 py-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
              active === id
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {label}
            <span
              className={`text-xs font-bold tabular-nums ${
                active === id ? 'text-amber-300' : 'text-zinc-400'
              }`}
            >
              {counts[id]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
