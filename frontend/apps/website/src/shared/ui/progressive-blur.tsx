'use client';
import React from 'react';
import { cn } from '@/shared/utils';
import { HTMLMotionProps, motion } from 'motion/react';

export const GRADIENT_ANGLES = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
};

export type ProgressiveBlurProps = {
  direction?: keyof typeof GRADIENT_ANGLES;
  blurLayers?: number;
  className?: string;
  blurIntensity?: number;
} & HTMLMotionProps<'div'>;

export function ProgressiveBlur({
  direction: _direction = 'bottom',
  blurLayers = 8,
  className,
  blurIntensity = 0.25,
  ...props
}: ProgressiveBlurProps) {
  const layers = Math.max(blurLayers, 2);
  const segmentSize = 1 / (blurLayers + 1);

  // Safely get gradient angle for direction
  const getGradientAngle = (
    direction: keyof typeof GRADIENT_ANGLES,
  ): number => {
    switch (direction) {
      case 'top':
        return GRADIENT_ANGLES.top;
      case 'right':
        return GRADIENT_ANGLES.right;
      case 'bottom':
        return GRADIENT_ANGLES.bottom;
      case 'left':
        return GRADIENT_ANGLES.left;
      default:
        return GRADIENT_ANGLES.bottom;
    }
  };

  return (
    <div className={cn('relative', className)}>
      {Array.from({ length: layers }).map((_, index) => {
        const gradientStops = [
          index * segmentSize,
          (index + 1) * segmentSize,
          (index + 2) * segmentSize,
          (index + 3) * segmentSize,
        ].map(
          (pos, posIndex) =>
            `rgba(255, 255, 255, ${posIndex === 1 || posIndex === 2 ? 1 : 0}) ${pos * 100}%`,
        );

        const angle = getGradientAngle(_direction);
        const gradient = `linear-gradient(${angle}deg, ${gradientStops.join(
          ', ',
        )})`;

        return (
          <motion.div
            key={index}
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              maskImage: gradient,
              WebkitMaskImage: gradient,
              backdropFilter: `blur(${index * blurIntensity}px)`,
              WebkitBackdropFilter: `blur(${index * blurIntensity}px)`,
            }}
            {...props}
          />
        );
      })}
    </div>
  );
}
