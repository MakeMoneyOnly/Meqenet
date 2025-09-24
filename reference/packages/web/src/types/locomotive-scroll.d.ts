declare module 'locomotive-scroll' {
  export interface LocomotiveScrollOptions {
    el?: HTMLElement;
    name?: string;
    offset?: number;
    repeat?: boolean;
    smooth?: boolean;
    smoothMobile?: boolean;
    direction?: 'vertical' | 'horizontal';
    inertia?: number;
    class?: string;
    scrollbarClass?: string;
    scrollingClass?: string;
    draggingClass?: string;
    smoothClass?: string;
    initClass?: string;
    getSpeed?: boolean;
    getDirection?: boolean;
    multiplier?: number;
    firefoxMultiplier?: number;
    touchMultiplier?: number;
    resetNativeScroll?: boolean;
    tablet?: {
      smooth?: boolean;
      direction?: 'vertical' | 'horizontal';
      breakpoint?: number;
    };
    smartphone?: {
      smooth?: boolean;
      direction?: 'vertical' | 'horizontal';
      breakpoint?: number;
    };
    reloadOnContextChange?: boolean;
    lerp?: number;
    [key: string]: unknown;
  }

  export default class LocomotiveScroll {
    constructor(options?: LocomotiveScrollOptions);
    
    destroy(): void;
    
    update(): void;
    
    start(): void;
    
    stop(): void;
    
    scrollTo(target: string | number | HTMLElement, options?: Record<string, unknown>): void;
    
    setScroll(x: number, y: number): void;
    
    on(eventName: string, callback: (data: Record<string, unknown>) => void): void;
  }
} 