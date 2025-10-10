'use client';

import React, { useState } from 'react';
import Preloader from './Preloader';
import { LocomotiveScrollProvider } from './ui/LocomotiveScrollContext';
import BlurOnScroll from './ui/BlurOnScroll';
// import HeroSection, { HeroSectionProps } from '../landing/HeroSection';

export default function InnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);

  // Helper to inject 'show' prop to the first child (e.g., HeroSection)
  // function injectShowProp(child: React.ReactNode) {
  //   if (React.isValidElement(child) && child.type === HeroSection) {
  //     return React.cloneElement(child as React.ReactElement<HeroSectionProps>, {
  //       show: !isLoading,
  //     });
  //   }
  //   return child;
  // }

  return (
    <>
      {isLoading ? (
        <Preloader onAnimationComplete={() => setIsLoading(false)} />
      ) : null}
      <main>
        <LocomotiveScrollProvider>
          <BlurOnScroll>
            {/* {React.Children.map(children, injectShowProp)} */}
            {children}
          </BlurOnScroll>
        </LocomotiveScrollProvider>
      </main>
    </>
  );
}
