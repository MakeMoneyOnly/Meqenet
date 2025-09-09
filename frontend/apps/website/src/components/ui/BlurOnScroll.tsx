'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ProgressiveBlur } from './progressive-blur';
import { motion } from 'framer-motion';

/**
 * BlurOnScroll (fixed)
 * - Blur overlay only (no forced opacity-0/blur on all children)
 * - Safer: does not hide content if JS fails
 * - You can add fade-in to specific sections/components as needed
 */
export default function BlurOnScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show blur overlay while scrolling, hide after 300ms idle
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => setIsScrolling(false), 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  return (
    <div className="relative">
      {/* Blur overlay, fades in/out smoothly. Lower intensity for safety. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isScrolling ? 1 : 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="fixed inset-0 z-40 pointer-events-none"
      >
        <ProgressiveBlur
          direction="bottom"
          blurLayers={6}
          blurIntensity={0.8}
        />
      </motion.div>
      {/* Content is always visible */}
      <div>{children}</div>
    </div>
  );
}
