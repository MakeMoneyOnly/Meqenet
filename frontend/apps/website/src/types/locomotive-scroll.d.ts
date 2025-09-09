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
    constructor(_options?: LocomotiveScrollOptions);

    destroy(): void;

    update(): void;

    start(): void;

    stop(): void;

    scrollTo(
      _target: string | number | HTMLElement,
      _options?: Record<string, unknown>,
    ): void;

    setScroll(_x: number, _y: number): void;

    on(
      _eventName: string,
      _callback: (_data: Record<string, unknown>) => void,
    ): void;
  }
}
