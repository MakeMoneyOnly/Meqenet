'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { cn } from '@/lib/utils';

const ACTION_WORDS = Object.freeze([
  'Shop Now',
  'Buy Now',
  'Try Now',
  'Fly Now',
  'Buy Now',
] as const);

const ACTION_WORD_KEYS = ACTION_WORDS.map((_, index) => index);
const TOTAL_WORDS = ACTION_WORDS.length;

const getActionWord = (idx: number): string =>
  Number.isInteger(idx) && idx >= 0 && idx < TOTAL_WORDS
    ? ACTION_WORDS[idx]
    : ACTION_WORDS[0];

const AnimatedActionText = () => {
  const [index, setIndex] = useState(0);
  const [maxWidth, setMaxWidth] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);

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

      let max = 0;
      ACTION_WORD_KEYS.forEach((key) => {
        const word = getActionWord(key);
        tempSpan.textContent = word;
        max = Math.max(max, tempSpan.offsetWidth);
      });

      document.body.removeChild(tempSpan);
      setMaxWidth(max);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % TOTAL_WORDS);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={textRef}
      className="relative inline-block"
      style={{ minWidth: maxWidth > 0 ? `${maxWidth}px` : 'auto' }}
    >
      <AnimatePresence mode="wait">
        {(() => {
          // Safe array access with bounds checking
          const currentIndex =
            index >= 0 && index < ACTION_WORD_KEYS.length ? index : 0;

          // Safe array access with explicit bounds checking
          let currentWord = 'Shop Now';
          if (currentIndex >= 0 && currentIndex < ACTION_WORD_KEYS.length) {
            currentWord = ACTION_WORDS[ACTION_WORD_KEYS[currentIndex]];
          }

          return (
            <motion.span
              key={currentWord}
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
              {currentWord}
            </motion.span>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedActionText;
