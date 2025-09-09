'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * FadeInSection
 * Wraps a section and animates it from blurred/faded to clear/visible
 * as it enters the viewport. Use for premium scroll reveal effects.
 */
export default function FadeInSection({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, filter: 'blur(24px)' }}
      animate={isVisible ? { opacity: 1, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
