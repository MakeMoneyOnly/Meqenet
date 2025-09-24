'use client';

import { motion, Easing } from 'framer-motion';
import { useEffect, useState } from 'react';

const title = "meqenet";

const containerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const letterVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: 'easeOut' as Easing,
    },
  },
};

export default function Preloader({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  // Total text animation time is approx. (staggerChildren * letters) + letter duration
  // 0.1 * 7 + 0.8 = 1.5s. We'll wait a bit longer before exiting.
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 2500); // Wait 2.5s before exiting

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black text-white"
      initial={{ y: 0 }}
      animate={{ y: isExiting ? '-100vh' : 0 }}
      transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={isExiting ? onAnimationComplete : undefined}
    >
      <motion.div
        className="flex items-baseline"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {title.split('').map((letter, index) => (
          <motion.span
            key={index}
            variants={letterVariants}
            className="text-3xl font-light tracking-tight"
          >
            {letter}
          </motion.span>
        ))}
        <motion.sup
          className="text-lg font-light tracking-wider"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: title.length * 0.1 + 0.5, duration: 0.8 }}
        >
          &reg;
        </motion.sup>
      </motion.div>
    </motion.div>
  );
} 