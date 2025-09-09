declare module 'lenis' {
  export interface LenisOptions {
    duration?: number;
    easing?: (_t: number) => number;
    direction?: 'vertical' | 'horizontal';
    gestureDirection?: 'vertical' | 'horizontal';
    smooth?: boolean;
    smoothTouch?: boolean;
    touchMultiplier?: number;
    infinite?: boolean;
    [key: string]: unknown;
  }

  export default class Lenis {
    constructor(_options?: LenisOptions);
    raf(_time: number): void;
    destroy(): void;
  }
}
