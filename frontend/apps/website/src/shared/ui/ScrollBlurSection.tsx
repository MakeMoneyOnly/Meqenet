'use client';
import React from 'react';
import { motion } from 'framer-motion';

/**
 * ScrollBlurSection
 * Receives a `blurred` prop and animates blur/fade accordingly.
 */
export default function ScrollBlurSection({
  children,
  blurred,
  className = '',
}: {
  children: React.ReactNode;
  blurred: boolean;
  className?: string;
}) {
  return (
    <motion.div
      animate={{
        filter: blurred ? 'blur(18px)' : 'blur(0px)',
        opacity: blurred ? 0.5 : 1,
      }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
