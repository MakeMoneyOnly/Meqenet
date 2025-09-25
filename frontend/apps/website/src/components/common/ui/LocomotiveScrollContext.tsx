'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

// Context to provide Locomotive Scroll's scrollY and a trigger for children
const LocomotiveScrollContext = createContext<{
  scrollY: number;
  trigger: number;
}>({ scrollY: 0, trigger: 0 });

export function useLocomotiveScroll() {
  return useContext(LocomotiveScrollContext);
}

export function LocomotiveScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scrollY, setScrollY] = useState(0);
  const [trigger, setTrigger] = useState(0);
  const scrollInstanceRef = useRef<unknown>(null);
  const lastScrollYRef = useRef(0);
  const updateTimeoutRef = useRef<number | null>(null);

  // Balanced scroll handler - frequent enough for blur effects, safe from infinite loops
  const handleScroll = useCallback((data: Record<string, unknown>) => {
    // Safely extract scroll data
    const scrollData = data as { scroll?: { y?: number } };
    const newScrollY = scrollData.scroll?.y ?? 0;

    // Very small threshold for ultra-smooth blur effects
    const threshold = 0.5; // Update every 0.5px for ultra-smooth blur transitions
    if (Math.abs(newScrollY - lastScrollYRef.current) < threshold) return;

    // Clear any pending updates to prevent accumulation
    if (updateTimeoutRef.current) {
      window.clearTimeout(updateTimeoutRef.current);
    }

    // Minimal debounce for maximum smoothness while preventing infinite loops
    updateTimeoutRef.current = window.setTimeout(() => {
      lastScrollYRef.current = newScrollY;
      setScrollY(newScrollY);

      // Update trigger more frequently for ultra-smooth blur effects
      setTrigger((prev) => prev + 1);
    }, 4); // Ultra-short debounce (4ms) for maximum smoothness
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initSmoothScrolling = async () => {
      try {
        const LocomotiveScroll = (await import('locomotive-scroll')).default;
        const scrollContainer = document.getElementById('scroll-container');
        if (!scrollContainer) {
          return () => {
            // No-op: scroll container not found
          };
        }

        const scrollInstance = new LocomotiveScroll({
          el: scrollContainer,
          smooth: true,
          smoothMobile: true,
          multiplier: 1,
          lerp: 0.08, // Slightly higher lerp for smoother interpolation
          smartphone: { smooth: true },
          tablet: { smooth: true },
        });

        scrollInstanceRef.current = scrollInstance;

        // Use the stable callback with proper typing
        (
          scrollInstance as {
            on: (
              _event: string,

              _callback: (_data: Record<string, unknown>) => void,
            ) => void;
            destroy: () => void;
          }
        ).on('scroll', handleScroll);

        return () => {
          // Safe dynamic access - accessing destroy method on scroll instance
          (scrollInstance as { destroy: () => void }).destroy();
          scrollInstanceRef.current = null;
        };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize Locomotive Scroll:', error);
        return () => {
          // No-op: failed to initialize scroll
        };
      }
    };

    initSmoothScrolling().then((fn) => {
      cleanup = fn;
    });
    return () => {
      if (cleanup) cleanup();
      // Clear any pending timeout on cleanup
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };
  }, [handleScroll]);

  return (
    <LocomotiveScrollContext.Provider value={{ scrollY, trigger }}>
      {children}
    </LocomotiveScrollContext.Provider>
  );
}
