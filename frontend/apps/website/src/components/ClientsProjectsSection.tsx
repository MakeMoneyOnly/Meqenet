import React from 'react';
import LogoCloud from '@/components/common/logo-cloud';
import Image from 'next/image';
import ScrollBlurItem from '@/components/common/ui/ScrollBlurItem';
import { ArrowRight } from 'lucide-react';



// A new component for the feature cards, as requested.
const FeatureCard = ({
  title,
  linkText,
  imageSrc,
  imageAlt,
  linkUrl = "#",
}: {
  title: string;
  linkText: string;
  imageSrc: string;
  imageAlt: string;
  linkUrl?: string;
}) => {
  return (
    <div>
      <ScrollBlurItem>
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden mb-4 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            unoptimized
          />
        </div>
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <a
          href={linkUrl}
          className="font-medium text-sm flex items-center group text-gray-700 hover:text-black transition-colors"
        >
          {linkText}
          <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </a>
      </ScrollBlurItem>
    </div>
  );
};


// Results section with statistics
const ResultsSection = () => {
  return (
    <div className="w-full py-20 mt-20">
      <div className="w-[calc(100%-80px)] max-w-[1500px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 mb-16 md:mb-32 lg:mb-48 items-start">
          <div className="lg:col-span-2 flex items-center mb-4 lg:mb-0">
              <div className="w-5 h-5 bg-black rounded-full mr-2 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 0V10M0 5H10" stroke="white" strokeWidth="1.5" />
                </svg>
              </div>
              <ScrollBlurItem>
                <span className="text-sm font-light">Why choose us</span>
              </ScrollBlurItem>
            </div>
          <div className="lg:col-span-10">
            <div className="lg:pl-12" style={{lineHeight: 1.05}}>
              <ScrollBlurItem>
                <h2 className="text-black font-bold text-3xl sm:text-4xl md:text-5xl lg:text-[56px] mb-2" style={{lineHeight: 1.05}}>
                  Driving Growth for Ethiopian
                </h2>
              </ScrollBlurItem>
              <ScrollBlurItem>
                <div className="text-gray-400 font-normal text-3xl sm:text-4xl md:text-5xl lg:text-[56px]" style={{fontWeight: 400, lineHeight: 1.05}}>
                  Businesses and Consumers.
                </div>
              </ScrollBlurItem>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden w-[calc(100%-80px)] max-w-[1500px] mx-auto">
            <Image
              src="https://images.unsplash.com/photo-1532939163844-547f958e91c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1548&q=80"
              alt="Road in desert with mountains"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute top-3 right-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="black" fillOpacity="0.1" />
                <path d="M8 12H16M12 8V16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div>
            <div className="mb-8 md:mb-16 text-right">
              <ScrollBlurItem>
                <p className="text-base md:text-xl lg:text-2xl" style={{lineHeight: 1.4, margin: 0}}>
                  <span className="font-bold text-black">Empowering the economy.</span>
                  <span style={{color: 'rgba(0,0,0,0.4)'}}>
                    &nbsp;We provide seamless payment solutions that boost sales for merchants and offer flexibility for shoppers, project after project.
                  </span>
                </p>
              </ScrollBlurItem>
            </div>
            <div className="w-[calc(100%-80px)] max-w-[1500px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[5px]">
                <div className="flex flex-col gap-[5px]">
                  <div className="rounded-xl p-5 shadow-[0_5px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.07)] transition-shadow duration-300 h-24 md:h-28">
                    <div className="flex justify-between items-center mb-1">
                  <ScrollBlurItem>
                        <div className="text-[40px] md:text-[48px] lg:text-[56px] font-bold text-black">30%+</div>
                  </ScrollBlurItem>
                  <ScrollBlurItem>
                        <div className="text-xs text-gray-400">01</div>
                  </ScrollBlurItem>
                </div>
                </div>
                  <div className="rounded-xl p-5 flex flex-col shadow-[0_5px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.07)] transition-shadow duration-300 h-64 md:h-72">
                    <div className="text-right mb-auto">
                    <ScrollBlurItem>
                        <div className="text-sm font-medium">Average Increase</div>
                        <div className="text-sm font-medium">in Sales</div>
                    </ScrollBlurItem>
                  </div>
                  <div className="mt-auto">
                    <ScrollBlurItem>
                        <div className="text-sm text-gray-600 text-right">
                        Our merchant partners see a significant boost in conversion rates and average order value.
                      </div>
                    </ScrollBlurItem>
                  </div>
                </div>
              </div>
                <div className="flex flex-col gap-[5px]">
                  <div className="rounded-xl p-5 shadow-[0_5px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.07)] transition-shadow duration-300 h-24 md:h-28">
                    <div className="flex justify-between items-center mb-1">
                  <ScrollBlurItem>
                        <div className="text-[40px] md:text-[48px] lg:text-[56px] font-bold text-black">50k+</div>
                  </ScrollBlurItem>
                  <ScrollBlurItem>
                        <div className="text-xs text-gray-400">02</div>
                  </ScrollBlurItem>
                </div>
                  </div>
                  <div className="rounded-xl p-5 flex flex-col shadow-[0_5px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.07)] transition-shadow duration-300 h-64 md:h-72">
                    <div className="text-right mb-auto">
                      <ScrollBlurItem>
                        <div className="text-sm font-medium">Active Users</div>
                        <div className="text-sm font-medium">and growing</div>
                      </ScrollBlurItem>
                    </div>
                    <div className="mt-auto">
                    <ScrollBlurItem>
                        <div className="text-sm text-gray-600 text-right">
                          Join a rapidly expanding community of savvy Ethiopian shoppers enjoying payment flexibility.
                      </div>
                    </ScrollBlurItem>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ClientsProjectsSection() {
    const waysToPay = [
    {
      title: "At Checkout",
      imageSrc: "https://images.unsplash.com/photo-1589793463343-0a7c930a3b83?auto=format&fit=crop&w=800&q=60",
      imageAlt: "A person holding a phone showing a checkout screen.",
      linkText: "Learn more",
    },
    {
      title: "In the Meqenet App",
      imageSrc: "https://images.unsplash.com/photo-1601784551446-20c9e07cd66d?auto=format&fit=crop&w=800&q=60",
      imageAlt: "A hand holding a smartphone with a shopping app open.",
      linkText: "Get the app",
    },
    {
      title: "Digital Wallets",
      imageSrc: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=60",
      imageAlt: "A phone displaying a digital wallet payment screen.",
      linkText: "Learn more",
    },
    {
      title: "Meqenet Virtual Card",
      imageSrc: "https://images.unsplash.com/photo-1556742502-ec7c0e2f3440?auto=format&fit=crop&w=800&q=60",
      imageAlt: "A physical credit card being used at a point-of-sale terminal.",
      linkText: "Learn more",
    },
  ];

  const partnerLogos = [
    { name: 'Telebirr', path: '/partners/telebirr.svg', width: 100, height: 28 },
    { name: 'CBE Birr', path: '/partners/cbebirr.svg', width: 100, height: 28 },
    { name: 'Dashen Bank', path: '/partners/dashen.svg', width: 100, height: 28 },
    { name: 'Bank of Abyssinia', path: '/partners/abyssinia.svg', width: 100, height: 28 },
    { name: 'ShebaMiles', path: '/partners/shebamiles.svg', width: 100, height: 28 },
    { name: 'Ethiopian Airlines', path: '/partners/ethiopian.svg', width: 100, height: 28 },
  ];

  return (
    <div className="w-full py-10 relative">
      <div className="w-[calc(100%-80px)] max-w-[1500px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 mb-8 items-start">
          <div className="lg:col-span-2 flex items-center mb-4 lg:mb-0">
            <div className="w-5 h-5 bg-black rounded-full mr-2 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 0V10M0 5H10" stroke="white" strokeWidth="1.5" />
              </svg>
            </div>
            <ScrollBlurItem>
              <span className="text-sm font-light">Our clients</span>
            </ScrollBlurItem>
          </div>
          <div className="lg:col-span-10"></div>
        </div>
        
        <div className="mb-24">
          <LogoCloud logos={partnerLogos} />
        </div>
      </div>
      
      <div className="w-[calc(100%-80px)] max-w-[1500px] mx-auto">
        <div className="mb-2">
          <ScrollBlurItem>
            <div className="text-xs text-gray-500 font-light">(27)</div>
          </ScrollBlurItem>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 pb-16 items-start">
          <div className="lg:col-span-2"></div>
          
          <div className="lg:col-span-10 lg:pl-12">
            <ScrollBlurItem>
              <h1 className="text-[90px] md:text-[130px] lg:text-[180px] font-medium tracking-tighter leading-[0.77] text-black">
                Everywhere<span className="text-black">.</span>
              </h1>
            </ScrollBlurItem>
              <ScrollBlurItem>
              <p className="text-sm text-gray-500 mt-2">©2025</p>
              </ScrollBlurItem>
          
            <div className="lg:absolute right-0 bottom-8 max-w-sm text-right mt-8 lg:mt-0">
            <ScrollBlurItem>
              <p className="text-sm leading-relaxed text-gray-500 font-light">
                From your favorite local shops to major online stores, Meqenet is your passport to flexible payments. Discover where you can shop.
              </p>
            </ScrollBlurItem>
            </div>
          </div>
        </div>

        {/* This is the new section replacing the old grid. */}
        <div className="pb-16 md:pb-24">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Use Meqenet anywhere you shop
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {waysToPay.map((item) => (
                <FeatureCard
                key={item.title}
                title={item.title}
                imageSrc={item.imageSrc}
                imageAlt={item.imageAlt}
                linkText={item.linkText}
                />
            ))}
            </div>
        </div>
      </div>

      <ResultsSection />
    </div>
  );
}
 