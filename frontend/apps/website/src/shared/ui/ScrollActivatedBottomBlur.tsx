'use client';
import React from 'react';
import { motion } from 'framer-motion';

/**
 * ScrollActivatedBottomBlur
 * Shows a premium bottom blur overlay when `visible` is true.
 * Controlled by parent (e.g., Locomotive Scroll events).
 */
export default function ScrollActivatedBottomBlur({
  visible,
}: {
  visible: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="pointer-events-none fixed bottom-0 left-0 w-full h-20 z-50"
      aria-hidden="true"
      style={{
        background:
          'linear-gradient(to top, rgba(255,255,255,0.18) 60%, rgba(255,255,255,0.08) 85%, rgba(255,255,255,0) 100%)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        transition: 'background 0.3s, backdrop-filter 0.3s',
        maskImage:
          'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}
    />
  );
}
