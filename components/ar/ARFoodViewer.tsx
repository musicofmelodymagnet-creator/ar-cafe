'use client';

import { useEffect, useRef, useState } from 'react';
import type { MenuItem } from '@/app/types';


interface ARFoodViewerProps {
  item: MenuItem;
  onClose: () => void;
  tableNumber: number | null;
  onAddToCart: () => void;
}

type ARStatus = 'not-presenting' | 'session-started' | 'object-placed' | 'failed';

export default function ARFoodViewer({ item, onClose, tableNumber, onAddToCart }: ARFoodViewerProps) {
  const modelViewerRef = useRef<HTMLElement>(null);
  const [arStatus, setArStatus] = useState<ARStatus>('not-presenting');
  const [isLoading, setIsLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  // Detect iOS for Quick Look fallback
  const isIOS = typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    // Dynamically import model-viewer to avoid SSR issues
    import('@google/model-viewer').catch(() => {
      // model-viewer registers itself as a custom element on import
    });
  }, []);

  useEffect(() => {
    const el = modelViewerRef.current;
    if (!el) return;

    const handleLoad = () => setIsLoading(false);
    const handleARStatus = (e: Event) => {
      const customEvent = e as CustomEvent<{ status: ARStatus }>;
      const status = customEvent.detail?.status ?? 'not-presenting';
      setArStatus(status);
      if (status === 'session-started') setShowInstructions(true);
      if (status === 'object-placed') setShowInstructions(false);
    };

    el.addEventListener('load', handleLoad);
    el.addEventListener('ar-status', handleARStatus);

    return () => {
      el.removeEventListener('load', handleLoad);
      el.removeEventListener('ar-status', handleARStatus);
    };
  }, []);

  // iOS Quick Look URL with custom banner params
  const iosArUrl = (() => {
    const params = new URLSearchParams({
      callToAction: 'Добавить в корзину',
      checkoutTitle: item.name,
      checkoutSubtitle: `Стол №${tableNumber ?? '—'} • ${item.price} ₽`,
      price: `${item.price} ₽`,
    });
    return `${item.usdzSrc}#${params.toString()}`;
  })();

  const isMobile = typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm z-10">
        <div>
          <h2 className="text-white font-semibold text-lg leading-tight">{item.name}</h2>
          <p className="text-amber-400 text-sm font-medium">{item.price} ₽</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Закрыть"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Model Viewer */}
      <div className="relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-3 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              <p className="text-white/70 text-sm">Загрузка 3D-модели…</p>
            </div>
          </div>
        )}

        {/* AR placement instruction overlay */}
        {showInstructions && arStatus === 'session-started' && (
          <div className="absolute inset-x-0 bottom-32 flex justify-center z-20 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm text-white text-center px-6 py-3 rounded-2xl max-w-xs">
              <div className="flex justify-center mb-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400 animate-pulse">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <p className="text-sm font-medium">Плавно поводите телефоном</p>
              <p className="text-xs text-white/60 mt-1">для поиска поверхности стола</p>
            </div>
          </div>
        )}

        <model-viewer
          ref={modelViewerRef}
          src={item.glbSrc}
          ios-src={isIOS ? iosArUrl : item.usdzSrc}
          alt={item.name}
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="auto"
          camera-controls
          touch-action="pan-y"
          shadow-intensity="1.5"
          environment-image="neutral"
          exposure="1.0"
          auto-rotate={!isMobile}
          loading="eager"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Custom AR button */}
          <button
            slot="ar-button"
            className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-semibold px-6 py-3 rounded-full shadow-lg transition-all duration-150"
            aria-label="Просмотреть в дополненной реальности"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            Посмотреть на столе
          </button>
        </model-viewer>

        {/* Add to cart overlay (shown when AR object is placed) */}
        {arStatus === 'object-placed' && (
          <div className="absolute inset-x-0 bottom-8 flex justify-center z-20 px-4">
            <button
              onClick={onAddToCart}
              className="w-full max-w-sm bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-bold px-6 py-4 rounded-2xl shadow-2xl transition-all duration-150 text-base"
            >
              Добавить в корзину — {item.price} ₽
            </button>
          </div>
        )}
      </div>

      {/* Desktop / Non-AR add to cart */}
      {arStatus === 'not-presenting' && !isLoading && (
        <div className="px-4 pb-safe-area-inset-bottom pb-6 bg-black/80 backdrop-blur-sm">
          <div className="flex gap-3 pt-3">
            <div className="flex-1">
              <p className="text-white/60 text-xs mb-1">{item.calories} ккал · {item.description.slice(0, 60)}…</p>
            </div>
          </div>
          <button
            onClick={onAddToCart}
            className="w-full mt-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-bold px-6 py-4 rounded-2xl transition-all duration-150 text-base"
          >
            Добавить в корзину — {item.price} ₽
          </button>
        </div>
      )}
    </div>
  );
}
