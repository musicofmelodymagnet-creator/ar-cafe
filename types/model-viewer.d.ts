import type { HTMLAttributes, CSSProperties } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': HTMLAttributes<HTMLElement> & {
        src?: string;
        'ios-src'?: string;
        alt?: string;
        ar?: boolean | string;
        'ar-modes'?: string;
        'ar-scale'?: string;
        'camera-controls'?: boolean | string;
        'touch-action'?: string;
        'shadow-intensity'?: string;
        'environment-image'?: string;
        exposure?: string;
        'auto-rotate'?: boolean | string;
        loading?: string;
        poster?: string;
        style?: CSSProperties;
        ref?: unknown;
      };
    }
  }
}
