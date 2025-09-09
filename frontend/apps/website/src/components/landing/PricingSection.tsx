'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
    <path d="M12 8v8" stroke="black" />
    <path d="M8 12h8" stroke="black" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <div
    className={`flex items-center justify-center w-5 h-5 rounded-full bg-white ${className}`}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="black"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  </div>
);

const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState<'per_project' | 'monthly'>(
    'per_project',
  );
  const [sliderStyle, setSliderStyle] = useState({});

  const perProjectRef = useRef<HTMLButtonElement>(null);
  const monthlyRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateSlider = () => {
      if (billingCycle === 'per_project' && perProjectRef.current) {
        setSliderStyle({
          left: perProjectRef.current.offsetLeft,
          width: perProjectRef.current.offsetWidth,
        });
      } else if (billingCycle === 'monthly' && monthlyRef.current) {
        setSliderStyle({
          left: monthlyRef.current.offsetLeft,
          width: monthlyRef.current.offsetWidth,
        });
      }
    };

    updateSlider();
    window.addEventListener('resize', updateSlider);
    return () => window.removeEventListener('resize', updateSlider);
  }, [billingCycle]);

  const plans = {
    per_project: {
      name: 'Per project',
      price: '$2,490',
      description: 'Want more traffic and leads?',
      subDescription: 'Get marketing and SEO that starts with your goals.',
      features: [
        'Homepage + up to 4 inner pages',
        'Design and Development',
        'Mobile-Optimized Design',
      ],
      priceSuffix: '/project',
    },
    monthly: {
      name: 'Monthly',
      price: '$990',
      description: 'Ongoing support and growth.',
      subDescription: 'Continuous improvements for your online presence.',
      features: [
        'Monthly SEO strategy',
        'Performance monitoring',
        'Content updates',
      ],
      priceSuffix: '/month',
    },
  };

  const currentPlan =
    billingCycle === 'per_project' ? plans.per_project : plans.monthly;

  return (
    <section className="relative w-full bg-black text-white py-20 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,#3e3e3e,transparent)] opacity-20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="text-left mb-16 max-w-2xl">
          <div className="flex items-center text-sm font-medium text-neutral-300">
            <PlusIcon className="w-5 h-5 mr-2 text-neutral-600" />
            Simple pricing
          </div>
          <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mt-4 text-white">
            Pricing.
          </h2>
        </div>

        <div className="flex justify-center mb-16">
          <div className="relative flex items-center p-1 bg-neutral-900 rounded-full border border-neutral-800">
            <button
              ref={perProjectRef}
              onClick={() => setBillingCycle('per_project')}
              className="relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-colors duration-300 text-white"
            >
              Per project
            </button>
            <button
              ref={monthlyRef}
              onClick={() => setBillingCycle('monthly')}
              className="relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-colors duration-300 text-white"
            >
              Monthly
            </button>
            <motion.div
              className="absolute top-1 bottom-1 bg-white rounded-full"
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              animate={sliderStyle}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={billingCycle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
          >
            <div className="lg:col-span-5 p-8 bg-neutral-900/50 rounded-2xl border border-neutral-800 flex flex-col justify-center">
              <h3 className="text-2xl font-semibold text-white">
                {currentPlan.description}
              </h3>
              <p className="mt-2 text-neutral-400">
                {currentPlan.subDescription}
              </p>
            </div>
            <div className="lg:col-span-7 p-8 bg-neutral-900/50 rounded-2xl border border-neutral-800 flex flex-col sm:flex-row justify-between sm:items-center">
              <div className="mb-6 sm:mb-0">
                <span className="text-5xl md:text-6xl font-bold text-white">
                  {currentPlan.price}
                </span>
                <span className="text-neutral-400">
                  {currentPlan.priceSuffix}
                </span>
              </div>
              <ul className="space-y-4 text-left sm:text-right">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center sm:justify-end">
                    <span className="mr-3 text-sm text-neutral-300">
                      {feature}
                    </span>
                    <CheckIcon />
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default PricingSection;
