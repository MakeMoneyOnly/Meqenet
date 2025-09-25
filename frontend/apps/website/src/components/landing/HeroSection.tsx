import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import ScrollBlurItem from '../common/ui/ScrollBlurItem';
import { motion, Variants } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

// Accept a ref to the next section for parallax stopping point
export interface HeroSectionProps {
  nextSectionRef?: React.RefObject<HTMLDivElement>;
  show?: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  nextSectionRef,
  show = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    // Only run on desktop
    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!cardRef.current) return;
          const card = cardRef.current;
          const cardRect = card.getBoundingClientRect();
          const cardTop = cardRect.top + window.scrollY;
          const scrollY = window.scrollY;
          let maxTranslate = 0;

          // If nextSectionRef is provided, stop parallax when next section reaches top
          if (nextSectionRef && nextSectionRef.current) {
            const nextRect = nextSectionRef.current.getBoundingClientRect();
            const nextTop = nextRect.top + window.scrollY;
            // The max translate is the distance from card's top to next section's top minus card's height
            maxTranslate = nextTop - cardTop - cardRect.height;
          } else {
            // Fallback: allow parallax for 60% of viewport height
            maxTranslate = window.innerHeight * 0.6;
          }

          // Parallax: move at 0.5x scroll speed, clamp to maxTranslate
          let newTranslate = Math.min(scrollY * 0.5, maxTranslate);
          newTranslate = Math.max(newTranslate, 0);
          setTranslateY(newTranslate);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [nextSectionRef, hasMounted]);

  // Animation variants
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const floatAnimation: Variants = {
    initial: { y: 0 },
    animate: {
      y: [-8, 8, -8],
      transition: {
        duration: 6,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      },
    },
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white py-2 sm:py-3 md:py-4 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute bottom-[15%] left-[5%] w-72 h-72 bg-green-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full h-[calc(100vh-60px)] sm:h-[calc(100vh-64px)] md:h-[calc(100vh-68px)] px-1 sm:px-2 mt-8 sm:mt-9 md:mt-10 lg:mt-11">
        {/* Hero Image Card - Parallax effect */}
        <div
          ref={cardRef}
          style={{
            transform: `translateY(-${translateY}px)`,
            willChange: 'transform',
            transition: 'transform 0.1s cubic-bezier(0.4,0,0.2,1)',
          }}
          className="relative w-full h-full overflow-hidden rounded-3xl shadow-2xl group top-0"
        >
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent z-10" />

          <Image
            src="/hero.png"
            alt="Meqenet BNPL Ethiopia Hero"
            fill
            className="object-cover object-center transition-all duration-700 group-hover:scale-105"
            priority
            quality={100}
          />

          {/* Hero Text Content - Inside card, left side */}
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 sm:p-12 md:p-16 lg:p-20 w-full"
            initial="hidden"
            animate={show ? 'visible' : 'hidden'}
            variants={staggerContainer}
          >
            <div className="w-full flex flex-col items-center mt-[-40px]">
              {/* Animated pill button */}
              <motion.div variants={fadeInUp} className="mb-4">
                <button
                  className="inline-flex items-center px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-[11px] sm:text-xs font-medium shadow-lg transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                  style={{ border: 'none' }}
                >
                  <span>Learn more</span>
                  <motion.span
                    className="ml-1"
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 2L9 6.5L4 11"
                        stroke="#fff"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.span>
                </button>
              </motion.div>

              {/* Main Hero Heading */}
              <motion.div variants={fadeInUp} className="mb-[-55px]">
                <h2 className="text-[28px] sm:text-[36px] md:text-[42px] font-medium text-white/90 leading-tight drop-shadow-lg text-center">
                  Experience the smarter way to pay
                </h2>
              </motion.div>

              {/* Large Brand Name */}
              <motion.div
                variants={fadeInUp}
                className="mb-6 w-full flex justify-center"
              >
                <h1 className="text-[80px] sm:text-[120px] md:text-[160px] lg:text-[220px] xl:text-[280px] 2xl:text-[340px] font-normal text-white leading-[0.8] tracking-[-0.08em] drop-shadow-xl text-center w-full flex items-center justify-center">
                  meqenet
                  <span className="text-green-400 inline-flex items-center ml-[10px]">
                    .
                  </span>
                </h1>
              </motion.div>

              {/* Tagline text */}
              <motion.div
                variants={fadeInUp}
                className="w-full flex justify-center mt-10"
              >
                <h2 className="text-[22px] sm:text-[28px] md:text-[36px] lg:text-[44px] font-light text-white/90 leading-[1.2] drop-shadow-lg max-w-4xl text-center">
                  Choose to pay in 4 interest-free payments
                  <br />
                  in full, in 30 days, or over time.
                </h2>
              </motion.div>
            </div>
          </motion.div>

          {/* Floating stats card */}
          <motion.div
            className="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 md:bottom-16 md:right-16 bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 max-w-[280px] sm:max-w-[320px] shadow-2xl border border-white/20 z-30"
            initial="initial"
            animate="animate"
            variants={floatAnimation}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/80 text-xs sm:text-sm">
                Growing Fast
              </span>
              <span className="text-green-400 text-xs sm:text-sm">2024</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-white/60 text-xs mb-1">Active Users</div>
                <div className="text-white text-xl sm:text-2xl font-bold">
                  50,000+
                </div>
              </div>
              <div>
                <div className="text-white/60 text-xs mb-1">
                  Partner Merchants
                </div>
                <div className="text-white text-xl sm:text-2xl font-bold">
                  500+
                </div>
              </div>
              <div>
                <div className="text-white/60 text-xs mb-1">
                  Customer Satisfaction
                </div>
                <div className="text-white text-xl sm:text-2xl font-bold">
                  96%
                </div>
              </div>
            </div>
          </motion.div>

          {/* Scroll indicator - Centered at bottom */}
          <motion.div
            className="absolute bottom-4 left-0 right-0 mx-auto flex flex-col items-center justify-center z-30 w-40"
            animate={{
              y: [0, 10, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <span className="text-white/80 text-xs mb-2">
              Scroll to explore
            </span>
            <ChevronDown className="text-white/80 w-5 h-5" />
          </motion.div>

          {/* Copyright/Attribution */}
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 md:bottom-6 md:left-6 text-white/40 text-xs z-40">
            <ScrollBlurItem>© 2024 meqenet</ScrollBlurItem>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
// CONTINUATION: No additional content needed, the file is complete and the warning was only due to line count. No further action required.
