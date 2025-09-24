'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CursorFollower = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = requestAnimationFrame(() => {
        setPosition({ x: e.clientX, y: e.clientY });
        const target = e.target as HTMLElement;
        const pointer = window.getComputedStyle(target).getPropertyValue('cursor') === 'pointer';
        setIsPointer(pointer);
      });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button')) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button')) {
        setIsHovering(false);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseover', handleMouseOver);
    document.body.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseover', handleMouseOver);
      document.body.removeEventListener('mouseout', handleMouseOut);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9999] pointer-events-none"
      style={{
        mixBlendMode: 'difference',
      }}
      animate={{
        width: isHovering || isPointer ? 32 : 12,
        height: isHovering || isPointer ? 32 : 12,
        x: position.x - (isHovering || isPointer ? 16 : 6),
        y: position.y - (isHovering || isPointer ? 16 : 6),
      }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, mass: 0.1 }}
    >
      <motion.div
        className="w-full h-full rounded-full bg-white"
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );
};

export default CursorFollower; 