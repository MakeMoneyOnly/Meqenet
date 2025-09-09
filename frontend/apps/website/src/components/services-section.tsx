import React, { useState } from 'react';
import { PlusIcon, MinusIcon, PlayIcon } from 'lucide-react';
import ScrollBlurItem from '@/components/common/ui/ScrollBlurItem';
// import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

type ServiceCategory = {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
  isOpen?: boolean;
};

export default function ServicesSection() {
  const [services, setServices] = useState<ServiceCategory[]>([
    {
      id: '001',
      number: '(001)',
      title: 'Seamless Onboarding',
      description:
        'Get started in minutes. Our streamlined KYC process uses your Ethiopian ID for instant approval.',
      image:
        'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=800&q=60',
      isOpen: true,
    },
    {
      id: '002',
      number: '(002)',
      title: 'Flexible Payment Plans',
      description:
        'Shop now and pay later with our 100% interest-free installment plans. Choose a schedule that works for you.',
      image:
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=60',
      isOpen: false,
    },
    {
      id: '003',
      number: '(003)',
      title: 'Secure In-App Purchasing',
      description:
        'Browse products from trusted Ethiopian merchants and check out securely, all within the Meqenet app.',
      image:
        'https://images.unsplash.com/photo-1580974918889-77a33a75225a?auto=format&fit=crop&w=800&q=60',
      isOpen: false,
    },
    {
      id: '004',
      number: '(004)',
      title: 'Simple Repayment',
      description:
        "Manage your payments easily through Telebirr, CBE Birr, and other local options. We'll send you reminders so you never miss a due date.",
      image:
        'https://images.unsplash.com/photo-1604940500624-a1c1dcec3c47?auto=format&fit=crop&w=800&q=60',
      isOpen: false,
    },
  ]);

  const toggleService = (id: string) => {
    setServices(
      services.map((service) =>
        service.id === id ? { ...service, isOpen: !service.isOpen } : service,
      ),
    );
  };

  return (
    <>
      {/* Services Section with Black Card */}
      <section className="relative min-h-screen py-4 overflow-hidden">
        <div className="relative z-10 w-full h-[calc(100vh-68px)] px-2 mt-11">
          <div className="relative w-full h-full overflow-hidden rounded-3xl shadow-2xl bg-black">
            <div className="w-[calc(100%-40px)] sm:w-[calc(100%-60px)] md:w-[calc(100%-80px)] max-w-[1500px] mx-auto py-8 sm:py-12 md:py-16">
              {/* Responsive layout for "What we do" section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 mb-6 sm:mb-8 items-start">
                {/* Left side with 'What we do' - using responsive grid */}
                <div className="lg:col-span-2 flex items-center mb-3 sm:mb-4 lg:mb-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full mr-2 flex items-center justify-center">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 10 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="sm:w-[10px] sm:h-[10px]"
                    >
                      <path
                        d="M5 0V10M0 5H10"
                        stroke="black"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                  <ScrollBlurItem>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      What we do
                    </span>
                  </ScrollBlurItem>
                </div>

                {/* Main heading with proper spacing - responsive positioning */}
                <div className="lg:col-span-10 lg:pl-12">
                  <ScrollBlurItem>
                    <h1 className="text-[60px] sm:text-[80px] md:text-[110px] lg:text-[140px] xl:text-[180px] font-medium tracking-tighter leading-[0.77] text-white">
                      Features<span className="text-white">.</span>
                    </h1>
                  </ScrollBlurItem>
                  <ScrollBlurItem>
                    <p className="text-xs sm:text-sm text-white/50 mt-1 sm:mt-2">
                      ©2024
                    </p>
                  </ScrollBlurItem>
                </div>
              </div>

              {/* Updated Services list to match exact spacing in reference image */}
              <div className="mt-20">
                {services.map((service) => (
                  <div key={service.id}>
                    <ServiceItem
                      service={service}
                      toggleService={() => toggleService(service.id)}
                    />

                    <AnimatePresence>
                      {service.isOpen ? (
                        <ServiceExpandedContent service={service} />
                      ) : null}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* CTA Button - Responsive alignment */}
              <ScrollBlurItem>
                <div className="mt-24 pl-0 lg:pl-32">
                  <Link
                    href="#"
                    className="inline-block rounded-full border border-white/20 bg-white text-black px-8 py-4 font-bold hover:bg-white/90 transition"
                  >
                    Download the App
                  </Link>
                </div>
              </ScrollBlurItem>
            </div>
          </div>
        </div>
      </section>

      {/* How we launch section - responsive layout with consistent spacing */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="w-[calc(100%-40px)] sm:w-[calc(100%-60px)] md:w-[calc(100%-80px)] max-w-[1500px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 mb-6 sm:mb-8 items-start">
            {/* Left side with 'About us' - consistent with What we do */}
            <div className="lg:col-span-2 flex items-center mb-3 sm:mb-4 lg:mb-0">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-black rounded-full mr-2 flex items-center justify-center">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="sm:w-[10px] sm:h-[10px]"
                >
                  <path d="M5 0V10M0 5H10" stroke="white" strokeWidth="1.5" />
                </svg>
              </div>
              <ScrollBlurItem>
                <span className="text-xs sm:text-sm font-bold">
                  Our Commitment
                </span>
              </ScrollBlurItem>
            </div>

            {/* fabrica text - consistent with Services positioning */}
            <div className="lg:col-span-10 lg:pl-12">
              <ScrollBlurItem>
                <p className="text-base sm:text-lg font-bold mb-6 sm:mb-8">
                  meqenet<sup>®</sup>
                </p>
              </ScrollBlurItem>

              {/* Main heading - consistent with Services */}
              <ScrollBlurItem>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                  <span className="text-black">
                    A transparent and fair financial
                  </span>
                  <br />
                  <span className="text-gray-400">
                    partner for all Ethiopians.
                  </span>
                </h2>
              </ScrollBlurItem>

              <ScrollBlurItem>
                <p className="text-gray-600 font-bold max-w-xs sm:max-w-sm md:max-w-md text-sm sm:text-base mb-4">
                  We combine secure technology and user-centric design to build
                  financial tools that empower our communities.
                </p>
              </ScrollBlurItem>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Cards Section - Responsive grid */}
      <section className="pb-3 sm:pb-4 -mt-4 sm:-mt-5 md:-mt-6">
        <div className="w-[calc(100%-40px)] sm:w-[calc(100%-60px)] md:w-[calc(100%-80px)] max-w-[1500px] mx-auto">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            style={{ transform: 'translateY(-5px)' }}
          >
            {/* Card 1 */}
            <ScrollBlurItem>
              <div className="bg-black text-white p-4 sm:p-5 rounded-xl shadow-md h-auto sm:h-[140px] md:h-[160px] opacity-90 hover:opacity-100 transition-opacity">
                <div className="flex items-center mb-2 sm:mb-3">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full mr-1" />
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gray-600 mr-1" />
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gray-600 mr-1" />
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gray-600" />
                  <span className="ml-auto text-gray-400 text-xs sm:text-sm">
                    01
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="mr-3 sm:mr-4">
                    <Image
                      src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                      alt="Financial inclusion for all Ethiopians"
                      width={40}
                      height={40}
                      className="rounded-lg object-cover w-[40px] h-[40px] sm:w-[50px] sm:h-[50px]"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-bold">
                      Financial Inclusion
                    </h3>
                    <p className="text-xs sm:text-sm text-white/80">
                      Fair access for all Ethiopians.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollBlurItem>

            {/* Card 2 */}
            <ScrollBlurItem>
              <div className="bg-black text-white p-5 rounded-xl shadow-md h-auto sm:h-[160px] lg:h-[160px] opacity-90 hover:opacity-100 transition-opacity">
                <div className="flex items-center mb-3">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mr-1" />
                  <div className="w-1.5 h-1.5 bg-white rounded-full mr-1" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-1" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                  <span className="ml-auto text-gray-400 text-sm">02</span>
                </div>
                <div className="flex items-start">
                  <div className="mr-4">
                    <Image
                      src="https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                      alt="Sharia-compliant financing"
                      width={50}
                      height={50}
                      className="rounded-lg object-cover w-[50px] h-[50px]"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold">Sharia Compliant</h3>
                    <p className="text-xs sm:text-sm text-white/80">
                      Ethical, interest-free financing.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollBlurItem>

            {/* Card 3 */}
            <ScrollBlurItem>
              <div className="bg-black text-white p-5 rounded-xl shadow-md h-auto sm:h-[160px] lg:h-[160px] opacity-90 hover:opacity-100 transition-opacity">
                <div className="flex items-center mb-3">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mr-1" />
                  <div className="w-1.5 h-1.5 bg-white rounded-full mr-1" />
                  <div className="w-1.5 h-1.5 bg-white rounded-full mr-1" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                  <span className="ml-auto text-gray-400 text-sm">03</span>
                </div>
                <div className="flex items-start">
                  <div className="mr-4">
                    <Image
                      src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1726&q=80"
                      alt="Empowering Ethiopian merchants"
                      width={50}
                      height={50}
                      className="rounded-lg object-cover w-[50px] h-[50px]"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold">Merchant Growth</h3>
                    <p className="text-xs sm:text-sm text-white/80">
                      Boost sales and gain customers.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollBlurItem>

            {/* Card 4 */}
            <ScrollBlurItem>
              <div className="bg-black text-white p-5 rounded-xl shadow-md h-auto sm:h-[160px] lg:h-[160px] opacity-90 hover:opacity-100 transition-opacity">
                <div className="flex items-center mb-3">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mr-1" />
                  <div className="w-1.5 h-1.5 bg-white rounded-full mr-1" />
                  <div className="w-1.5 h-1.5 bg-white rounded-full mr-1" />
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  <span className="ml-auto text-gray-400 text-sm">04</span>
                </div>
                <div className="flex items-start">
                  <div className="mr-4">
                    <Image
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"
                      alt="Secure and trusted payments"
                      width={50}
                      height={50}
                      className="rounded-lg object-cover w-[50px] h-[50px]"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold">Total Security</h3>
                    <p className="text-xs sm:text-sm text-white/80">
                      Your data and funds are safe.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollBlurItem>
          </div>
        </div>
      </section>

      {/* Video Player Section - Completely independent */}
      <section className="pb-16 sm:pb-24 md:pb-32 -mt-3 sm:-mt-4">
        <div className="w-[calc(100%-40px)] sm:w-[calc(100%-60px)] md:w-[calc(100%-80px)] max-w-[1500px] mx-auto">
          <ScrollBlurItem>
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-black group cursor-pointer h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] xl:h-[820px]">
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div className="w-full h-full transform group-hover:scale-110 group-hover:blur-sm transition-all duration-700 ease-in-out">
                  <Image
                    src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop"
                    alt="Showreel cover"
                    width={1920}
                    height={1080}
                    className="w-full h-full object-cover grayscale"
                    unoptimized
                  />
                </div>
              </div>

              {/* Play button and text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Play button that stays centered on hover */}
                <div className="relative transform group-hover:scale-110 transition-all duration-700 ease-in-out z-10">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-3 sm:mb-4 group-hover:mb-0 transition-all duration-700">
                    <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
                  </div>
                </div>

                {/* Text that fades out on hover */}
                <div className="transform group-hover:opacity-0 group-hover:translate-y-4 transition-all duration-500 ease-in-out">
                  <h3 className="text-white text-lg sm:text-xl md:text-2xl font-bold text-center">
                    Watch showreel
                  </h3>
                  <p className="text-white/70 text-xs sm:text-sm font-bold text-center">
                    (2016-25©)
                  </p>
                </div>
              </div>
            </div>
          </ScrollBlurItem>
        </div>
      </section>

      {/* Testimonials section - Responsive layout */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="w-[calc(100%-40px)] sm:w-[calc(100%-60px)] md:w-[calc(100%-80px)] max-w-[1500px] mx-auto">
          {/* Section header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 mb-8 sm:mb-10 items-start">
            <div className="lg:col-span-2 flex items-center mb-3 sm:mb-4 lg:mb-0">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-black rounded-full mr-2 flex items-center justify-center">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="sm:w-[10px] sm:h-[10px]"
                >
                  <path d="M5 0V10M0 5H10" stroke="white" strokeWidth="1.5" />
                </svg>
              </div>
              <ScrollBlurItem>
                <span className="text-xs sm:text-sm font-bold">
                  Testimonials
                </span>
              </ScrollBlurItem>
            </div>
            <div className="lg:col-span-10 lg:pl-12">
              <ScrollBlurItem>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                  <span className="text-black">Voices from Our</span>
                  <br />
                  <span className="text-gray-400">Community</span>
                </h2>
              </ScrollBlurItem>
            </div>
          </div>

          {/* Testimonials grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Testimonial 1: Shopper */}
            <ScrollBlurItem>
              <div className="p-6 sm:p-8 border border-gray-200 rounded-3xl">
                <p className="text-base sm:text-lg font-medium mb-4">
                  &quot;Finally, a way to buy what I need for my family without
                  the stress of interest. Meqenet was so easy to set up and use.
                  I bought a new refrigerator and paid for it over three months,
                  which was a huge help for my budget.&quot;
                </p>
                <div className="flex items-center">
                  <Image
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                    alt="Fatuma, Meqenet User"
                    width={40}
                    height={40}
                    className="rounded-full mr-4"
                    unoptimized
                  />
                  <div>
                    <p className="font-bold">Fatuma H.</p>
                    <p className="text-sm text-gray-500">
                      Shopper, Addis Ababa
                    </p>
                  </div>
                </div>
              </div>
            </ScrollBlurItem>

            {/* Testimonial 2: Merchant */}
            <ScrollBlurItem>
              <div className="p-6 sm:p-8 border border-gray-200 rounded-3xl">
                <p className="text-base sm:text-lg font-medium mb-4">
                  &quot;Integrating Meqenet at my electronics shop was the best
                  decision I made this year. My sales have increased by over
                  30%, and I get my settlements instantly. It brings in
                  customers who might not have made a purchase otherwise.&quot;
                </p>
                <div className="flex items-center">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                    alt="Daniel T., Merchant Partner"
                    width={40}
                    height={40}
                    className="rounded-full mr-4"
                    unoptimized
                  />
                  <div>
                    <p className="font-bold">Daniel T.</p>
                    <p className="text-sm text-gray-500">
                      Owner, Dani Electronics
                    </p>
                  </div>
                </div>
              </div>
            </ScrollBlurItem>
          </div>
        </div>
      </section>

      {/* Logos section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="w-[calc(100%-40px)] sm:w-[calc(100%-60px)] md:w-[calc(100%-80px)] max-w-[1500px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 mb-6 sm:mb-8 items-start">
            <div className="lg:col-span-2 flex items-center mb-3 sm:mb-4 lg:mb-0">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-black rounded-full mr-2 flex items-center justify-center">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="sm:w-[10px] sm:h-[10px]"
                >
                  <path d="M5 0V10M0 5H10" stroke="white" strokeWidth="1.5" />
                </svg>
              </div>
              <ScrollBlurItem>
                <span className="text-xs sm:text-sm font-bold">Trusted By</span>
              </ScrollBlurItem>
            </div>
            <div className="lg:col-span-10 lg:pl-12">
              <ScrollBlurItem>
                <p className="text-base sm:text-lg font-bold">
                  Powering commerce for leading Ethiopian businesses.
                </p>
              </ScrollBlurItem>
            </div>
          </div>

          <div className="lg:pl-32">
            <ScrollBlurItem>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-10 items-center">
                {/* Replace with actual partner logos */}
                <Image
                  src="/assets/images/partners/telebirr.svg"
                  alt="Telebirr"
                  width={140}
                  height={40}
                  className="opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition"
                />
                <Image
                  src="/assets/images/partners/cbe.svg"
                  alt="CBE Birr"
                  width={140}
                  height={40}
                  className="opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition"
                />
                <Image
                  src="/assets/images/partners/ethio-telecom.svg"
                  alt="Ethio Telecom"
                  width={140}
                  height={40}
                  className="opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition"
                />
                <Image
                  src="/assets/images/partners/boa.svg"
                  alt="Bank of Abyssinia"
                  width={140}
                  height={40}
                  className="opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition"
                />
                <Image
                  src="/assets/images/partners/dashen.svg"
                  alt="Dashen Bank"
                  width={140}
                  height={40}
                  className="opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition"
                />
              </div>
            </ScrollBlurItem>
          </div>
        </div>
      </section>

      {/* Video section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="w-[calc(100%-40px)] sm:w-[calc(100%-60px)] md:w-[calc(100%-80px)] max-w-[1500px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 mb-6 sm:mb-8 items-start">
            <div className="lg:col-span-2 flex items-center mb-3 sm:mb-4 lg:mb-0">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-black rounded-full mr-2 flex items-center justify-center">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="sm:w-[10px] sm:h-[10px]"
                >
                  <path d="M5 0V10M0 5H10" stroke="white" strokeWidth="1.5" />
                </svg>
              </div>
              <ScrollBlurItem>
                <span className="text-xs sm:text-sm font-bold">
                  How it Works
                </span>
              </ScrollBlurItem>
            </div>
            <div className="lg:col-span-10 lg:pl-12">
              <ScrollBlurItem>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  <span className="text-black">See Meqenet in</span>
                  <br />
                  <span className="text-gray-400">Action.</span>
                </h2>
              </ScrollBlurItem>
              <ScrollBlurItem>
                <p className="text-gray-600 font-bold max-w-xs sm:max-w-sm md:max-w-md text-sm sm:text-base">
                  Watch a short demo to see how simple it is to shop and pay
                  with Meqenet.
                </p>
              </ScrollBlurItem>
            </div>
          </div>

          <div className="lg:pl-32">
            <ScrollBlurItem>
              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl group">
                <Image
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80"
                  alt="Meqenet App Demo"
                  layout="fill"
                  objectFit="cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                    <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </button>
                </div>
              </div>
            </ScrollBlurItem>
          </div>
        </div>
      </section>

      <section className="h-40" />
    </>
  );
}

type ServiceItemProps = {
  service: ServiceCategory;
  toggleService: () => void;
};

function ServiceItem({ service, toggleService }: ServiceItemProps) {
  return (
    <div className="py-6">
      <ScrollBlurItem>
        <div className="flex items-center justify-between relative">
          {/* Left side number aligned with "What we do" text */}
          <div style={{ width: '160px', marginLeft: '-160px', flexShrink: 0 }}>
            <span className="text-white/50 text-sm font-bold">
              {service.number}
            </span>
          </div>

          {/* Service title aligned with "Services" text */}
          <div style={{ marginLeft: '65px', flexGrow: 1 }}>
            <h3 className="text-xl md:text-2xl font-bold text-white">
              {service.title}
            </h3>
          </div>

          {/* Toggle button with circle positioned on the far right */}
          <div style={{ marginRight: '-40px' }}>
            <button
              onClick={toggleService}
              className="w-10 h-10 rounded-full bg-black border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              {service.isOpen ? (
                <MinusIcon className="h-5 w-5 text-white" />
              ) : (
                <PlusIcon className="h-5 w-5 text-white" />
              )}
            </button>
          </div>

          {/* Horizontal line after the item - only show for non-expanded items */}
          {!service.isOpen && (
            <div className="absolute bottom-[-24px] left-[65px] right-0 border-t border-white/10" />
          )}
        </div>
      </ScrollBlurItem>
    </div>
  );
}

function ServiceExpandedContent({ service }: { service: ServiceCategory }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1], // Custom cubic-bezier curve for smooth animation
        opacity: { duration: 0.3 },
      }}
      className="overflow-hidden"
    >
      <div className="py-8 pb-12">
        <div className="flex">
          {/* Empty space to align with service number */}
          <div
            style={{ width: '160px', marginLeft: '-160px', flexShrink: 0 }}
          />

          <div className="flex-1" style={{ marginLeft: '65px' }}>
            <div className="grid grid-cols-12 gap-10">
              {/* Service image */}
              <div className="col-span-3">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="relative w-full aspect-square rounded-lg overflow-hidden"
                >
                  <Image
                    src="/service-web.jpg"
                    alt={service.title}
                    width={300}
                    height={300}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-medium text-white">M</span>
                  </div>
                </motion.div>
              </div>

              {/* Service description - exactly 2 lines as in reference */}
              <div className="col-span-5">
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-white/70 leading-relaxed font-bold"
                >
                  Modern, responsive, and user-friendly websites
                  <br />
                  designed to engage visitors and drive conversions.
                </motion.p>
              </div>

              {/* Categories - aligned at the same position as in reference */}
              <div className="col-span-4">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <p className="text-white/70 text-sm font-bold mb-3">
                    Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <CategoryPill>Packaging design</CategoryPill>
                    <CategoryPill>Logo design</CategoryPill>
                    <CategoryPill>Rebranding</CategoryPill>
                    <CategoryPill>Typography</CategoryPill>
                    <CategoryPill>Guidelines</CategoryPill>
                    <CategoryPill>Visual Identity</CategoryPill>
                    <CategoryPill>UI+</CategoryPill>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add horizontal line at the bottom of expanded content */}
      <div className="h-px w-full" style={{ marginLeft: '65px' }}>
        <div className="border-t border-white/10 w-[calc(100%-65px)]" />
      </div>
    </motion.div>
  );
}

function CategoryPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1.5 rounded-full border border-white/20 text-xs text-white/80 font-bold hover:bg-white/10 cursor-pointer transition">
      {children}
    </div>
  );
}
