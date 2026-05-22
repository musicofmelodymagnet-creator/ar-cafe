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
    <div className="sticky top-0 z-20 bg-surface-raised border-b border-border-subtle">
      <div className="max-w-2xl mx-auto px-4">
        <div
          role="tablist"
          className="flex gap-0 overflow-x-auto scrollbar-none"
        >
          {CATEGORIES.map(({ id, label }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(id)}
                className={`
                  relative flex-shrink-0 flex items-center gap-1.5
                  px-4 py-3.5 text-[13px] font-semibold
                  transition-colors duration-150
                  ${isActive
                    ? 'text-text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                  }
                `}
              >
                {label}
                <span className={`
                  text-[11px] font-bold tabular-nums
                  transition-colors duration-150
                  ${isActive ? 'text-accent' : 'text-text-muted'}
                `}>
                  {counts[id]}
                </span>

                {/* Active underline */}
                <span
                  className={`
                    absolute bottom-0 inset-x-4 h-[2px] rounded-full bg-accent
                    transition-opacity duration-200
                    ${isActive ? 'opacity-100' : 'opacity-0'}
                  `}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
