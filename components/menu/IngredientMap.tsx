'use client';

import { useState } from 'react';
import type { IngredientOrigin } from '@/app/types';

interface IngredientMapProps {
  ingredients: IngredientOrigin[];
}

export default function IngredientMap({ ingredients }: IngredientMapProps) {
  const [selected, setSelected] = useState<IngredientOrigin | null>(null);

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Состав и происхождение</p>
      <div className="flex flex-wrap gap-2">
        {ingredients.map((ing) => (
          <button
            key={ing.ingredient}
            onClick={() => setSelected(selected?.ingredient === ing.ingredient ? null : ing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
              selected?.ingredient === ing.ingredient
                ? 'bg-amber-400 border-amber-400 text-black'
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-amber-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            {ing.ingredient}
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-amber-500 mt-0.5 shrink-0"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-amber-900">{selected.ingredient}</p>
            <p className="text-xs text-amber-700">{selected.origin}</p>
            <p className="text-xs text-amber-600/70">
              {selected.lat.toFixed(2)}°{selected.lat >= 0 ? 'N' : 'S'},{' '}
              {selected.lng.toFixed(2)}°{selected.lng >= 0 ? 'E' : 'W'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
