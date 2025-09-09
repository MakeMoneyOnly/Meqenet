'use client';
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocomotiveScroll } from './LocomotiveScrollContext';

/**
 * ScrollBlurItem
 * Applies a blur/fade effect to any element as it enters from the bottom of the viewport,
 * using Locomotive Scroll's context for accurate scroll position.
 *
 * Explicitly sets display name for detection in wrapper functions.
 */
const ScrollBlurItem = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [blurred, setBlurred] = useState(true);
  const { trigger } = useLocomotiveScroll();

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    // Blurred if top is below 75% of viewport (earlier trigger for smoother experience)
    setBlurred(rect.top > window.innerHeight * 0.75);
  }, [trigger]);

  return (
    <motion.div
      ref={ref}
      animate={{
        filter: blurred ? 'blur(5px)' : 'blur(0px)',
        opacity: blurred ? 0.7 : 1,
      }}
      transition={{
        duration: blurred ? 0.6 : 0.3, // Slower blur in, faster unblur
        ease: blurred ? 'easeOut' : 'easeInOut', // Different easing for smoother feel
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Set display name explicitly for detection in wrapper functions
ScrollBlurItem.displayName = 'ScrollBlurItem';

export default ScrollBlurItem;
