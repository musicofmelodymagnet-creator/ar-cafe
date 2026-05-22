'use client';

import { useState } from 'react';
import type { IngredientOrigin } from '@/app/types';

interface IngredientMapProps {
  ingredients: IngredientOrigin[];
}

export default function IngredientMap({ ingredients }: IngredientMapProps) {
  const [selected, setSelected] = useState<IngredientOrigin | null>(null);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {ingredients.map((ing) => {
          const isSelected = selected?.ingredient === ing.ingredient;
          return (
            <button
              key={ing.ingredient}
              onClick={() => setSelected(isSelected ? null : ing)}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-full
                text-[12px] font-medium border
                transition-all duration-150
                ${isSelected
                  ? 'bg-accent text-accent-fg border-accent'
                  : 'bg-surface-subtle text-text-secondary border-border-subtle hover:border-border-default'
                }
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-accent-fg' : 'bg-text-muted'}`} />
              {ing.ingredient}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-2 flex items-start gap-2.5 px-3 py-2.5 bg-accent-subtle border border-accent/20 rounded-xl">
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className="text-accent shrink-0 mt-0.5"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-text-primary">{selected.ingredient}</p>
            <p className="text-[12px] text-text-secondary">{selected.origin}</p>
            <p className="text-[11px] text-text-muted font-mono mt-0.5">
              {Math.abs(selected.lat).toFixed(1)}°{selected.lat >= 0 ? 'N' : 'S'}&nbsp;
              {Math.abs(selected.lng).toFixed(1)}°{selected.lng >= 0 ? 'E' : 'W'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
