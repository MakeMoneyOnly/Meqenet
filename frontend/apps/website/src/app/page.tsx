'use client';

import React, { useEffect, useRef } from 'react';
import HeroSection from '@/components/landing/HeroSection';
import Header from '@/components/landing/Header';
import ServicesSection from '@/components/services-section';
import PricingSection from '@/components/PricingSection';
import TeamSection from '@/components/TeamSection';
import FAQSection from '@/components/FAQSection';
import TrendsSection from '@/components/TrendsSection';
import ContentSection from '@/components/content-3';
import FooterSection from '@/components/footer';
import ClientsProjectsSection from '@/components/ClientsProjectsSection';
import { wrapContentWithScrollBlurItem } from '@/components/common/ui/wrapContentWithScrollBlurItem';
import ContactCardSection from '@/components/ContactCardSection';
import NewsletterSection from '@/components/NewsletterSection';

export default function Home() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const clientsProjectsRef = useRef<HTMLDivElement | null>(null);
  const servicesRef = useRef<HTMLDivElement | null>(null);
  const teamRef = useRef<HTMLDivElement | null>(null);
  const faqRef = useRef<HTMLDivElement | null>(null);
  const trendsRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateBlurStates = () => {
      // Simple scroll update without blur states for now
      return;
    };

    let scroll: {
      on: (_event: string, _callback: () => void) => void;
      destroy: () => void;
    } | null = null;
    let cleanup: (() => void) | undefined;
    const initSmoothScrolling = async () => {
      try {
        const LocomotiveScroll = (await import('locomotive-scroll')).default;
        if (scrollRef.current) {
          scroll = new LocomotiveScroll({
            el: scrollRef.current,
            smooth: true,
            smoothMobile: true,
            multiplier: 1,
            lerp: 0.05,
            smartphone: { smooth: true },
            tablet: { smooth: true },
          });
          scroll.on('scroll', updateBlurStates);
          // Initial check
          setTimeout(updateBlurStates, 100);
          return () => scroll?.destroy();
        }
        return () => {
          // No cleanup needed when scroll container not found
        };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize smooth scrolling:', error);
        return () => {
          // No cleanup needed on initialization failure
        };
      }
    };
    initSmoothScrolling().then((fn) => {
      cleanup = fn;
    });
    window.addEventListener('resize', updateBlurStates);
    return () => {
      if (cleanup) cleanup();
      window.removeEventListener('resize', updateBlurStates);
    };
  }, []);

  return (
    <>
      <Header />
      <div
        ref={scrollRef}
        className="relative m-0 p-0 min-h-screen"
        data-scroll-container
        id="scroll-container"
      >
        {/* Hero Section */}
        <div
          ref={heroRef as React.RefObject<HTMLDivElement>}
          className="w-full min-h-screen"
          data-scroll-section
        >
          {wrapContentWithScrollBlurItem(
            <HeroSection
              nextSectionRef={
                clientsProjectsRef as React.RefObject<HTMLDivElement>
              }
            />,
          )}
        </div>
        {/* Clients and Projects Section */}
        <div
          ref={clientsProjectsRef as React.RefObject<HTMLDivElement>}
          className="relative z-10 w-full"
          data-scroll-section
          data-scroll-target="#scroll-container"
        >
          {wrapContentWithScrollBlurItem(<ClientsProjectsSection />)}
        </div>
        {/* Services Section */}
        <div
          ref={servicesRef as React.RefObject<HTMLDivElement>}
          className="w-full min-h-screen"
          data-scroll-section
        >
          {wrapContentWithScrollBlurItem(<ServicesSection />)}
        </div>
        {/* Pricing Section */}
        <div className="w-full" data-scroll-section>
          {wrapContentWithScrollBlurItem(<PricingSection />)}
        </div>
        {/* Team Section */}
        <div
          ref={teamRef as React.RefObject<HTMLDivElement>}
          className="w-full"
          data-scroll-section
        >
          {wrapContentWithScrollBlurItem(<TeamSection />)}
        </div>
        {/* FAQ Section */}
        <div
          ref={faqRef as React.RefObject<HTMLDivElement>}
          className="w-full"
          data-scroll-section
        >
          {wrapContentWithScrollBlurItem(<FAQSection />)}
        </div>
        {/* Trends Section */}
        <div
          ref={trendsRef as React.RefObject<HTMLDivElement>}
          className="w-full"
          data-scroll-section
        >
          {wrapContentWithScrollBlurItem(<TrendsSection />)}
        </div>
        {/* Contact Card Section */}
        <div className="w-full" data-scroll-section>
          {wrapContentWithScrollBlurItem(<ContactCardSection />)}
        </div>
        {/* Newsletter Section */}
        <div className="w-full" data-scroll-section>
          {wrapContentWithScrollBlurItem(<NewsletterSection />)}
        </div>
        {/* Content Section */}
        <div
          ref={contentRef as React.RefObject<HTMLDivElement>}
          className="relative z-30 w-full min-h-screen bg-white text-black flex items-center justify-center px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20"
          data-scroll-section
          data-scroll-target="#scroll-container"
        >
          <div className="w-full max-w-7xl mx-auto">
            {wrapContentWithScrollBlurItem(<ContentSection />)}
          </div>
        </div>
        {/* Footer Section */}
        <div
          ref={footerRef as React.RefObject<HTMLDivElement>}
          className="relative z-50 w-full bg-white text-black px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20 pb-16 sm:pb-24 md:pb-32"
          data-scroll-section
        >
          <div className="w-full max-w-7xl mx-auto">
            {wrapContentWithScrollBlurItem(<FooterSection />)}
          </div>
        </div>
      </div>
    </>
  );
}
