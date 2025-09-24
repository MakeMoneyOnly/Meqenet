'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { cn } from '@/lib/utils';

const actionWords = ['Shop Now', 'Buy Now', 'Try Now', 'Fly Now', 'Buy Now'];

const AnimatedActionText = () => {
  const [index, setIndex] = useState(0);
  const [maxWidth, setMaxWidth] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);

  // Calculate the width of the widest text
  useEffect(() => {
    if (typeof window !== 'undefined' && textRef.current) {
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.whiteSpace = 'nowrap';
      tempSpan.style.position = 'absolute';
      tempSpan.style.pointerEvents = 'none';
      tempSpan.style.fontSize = window.getComputedStyle(
        textRef.current,
      ).fontSize;
      tempSpan.style.fontFamily = window.getComputedStyle(
        textRef.current,
      ).fontFamily;
      document.body.appendChild(tempSpan);

      // Find the widest text
      let max = 0;
      actionWords.forEach((word) => {
        tempSpan.textContent = word;
        max = Math.max(max, tempSpan.offsetWidth);
      });

      document.body.removeChild(tempSpan);
      setMaxWidth(max);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % (actionWords.length - 1));
    }, 1800); // Slightly faster for better continuous feel

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={textRef}
      className="relative inline-block"
      style={{ minWidth: maxWidth > 0 ? `${maxWidth}px` : 'auto' }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={actionWords[index] ?? 'Shop Now'}
          initial={{ y: '0.1em', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-0.1em', opacity: 0 }}
          transition={{
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="inline-block whitespace-nowrap"
          style={{
            backfaceVisibility: 'hidden',
            verticalAlign: 'baseline',
          }}
        >
          {actionWords[index] ?? 'Shop Now'}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export default AnimatedActionText;
