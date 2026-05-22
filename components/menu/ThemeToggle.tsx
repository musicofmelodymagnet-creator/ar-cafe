'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';

export default function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  // Don't render until mounted — prevents hydration mismatch between
  // server (initial state = 'dark') and client (actual system preference)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      onClick={toggle}
      aria-label={
        !mounted ? 'Тема'
        : resolved === 'dark' ? 'Переключить на светлую тему'
        : 'Переключить на тёмную тему'
      }
      className="
        w-9 h-9 rounded-full flex items-center justify-center shrink-0
        bg-surface-inset text-text-secondary
        hover:bg-border-subtle hover:text-text-primary
        transition-colors duration-150
      "
      style={{ touchAction: 'manipulation' }}
    >
      {/* Render a neutral placeholder before mount */}
      {!mounted ? (
        <span className="w-4 h-4 rounded-full bg-border-default" />
      ) : resolved === 'dark' ? (
        // Sun icon
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Moon icon
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
