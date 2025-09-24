import React, { useState } from 'react';
import Image from 'next/image';
import ScrollBlurItem from '@/components/common/ui/ScrollBlurItem';
import { AnimatePresence, motion } from 'framer-motion';

const PricingSection: React.FC = () => {
  const [isForShoppers, setIsForShoppers] = useState(true);

  return (
    <>
      {/* Pricing Section with Black Card */}
      <section className="relative py-2 sm:py-3 md:py-4 overflow-hidden">
        <div className="relative z-10 w-full px-1 sm:px-2 mt-8 sm:mt-9 md:mt-10 lg:mt-11 mb-8 sm:mb-12 md:mb-16">
          <div className="relative w-full min-h-[120vh] sm:min-h-[110vh] md:min-h-[100vh] lg:min-h-[90vh] xl:min-h-[85vh] overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl bg-black">
            <div className="w-[calc(100%-40px)] sm:w-[calc(100%-60px)] md:w-[calc(100%-80px)] max-w-[1500px] mx-auto pt-8 sm:pt-12 md:pt-16 lg:pt-20 pb-36 sm:pb-40 md:pb-44 lg:pb-48">
              
              {/* Header Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 mb-6 sm:mb-8 items-start">
                {/* Left side with 'Simple pricing' label */}
                <div className="lg:col-span-2 flex items-center mb-3 sm:mb-4 lg:mb-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full mr-2 flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-[10px] sm:h-[10px]">
                      <path d="M5 0V10M0 5H10" stroke="black" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <ScrollBlurItem>
                    <span className="text-xs sm:text-sm font-bold text-white">Simple pricing</span>
                  </ScrollBlurItem>
                </div>
                
                {/* Main heading */}
                <div className="lg:col-span-10 lg:pl-12">
                  <ScrollBlurItem>
                    <h1 className="text-[60px] sm:text-[80px] md:text-[110px] lg:text-[140px] xl:text-[180px] font-medium tracking-tighter leading-[0.77] text-white">
                      Pricing<span className="text-white">.</span>
                    </h1>
                  </ScrollBlurItem>
                  <ScrollBlurItem>
                    <p className="text-xs sm:text-sm text-white/50 mt-1 sm:mt-2">Simple, transparent, and always interest-free.</p>
                  </ScrollBlurItem>
                </div>
              </div>

              {/* Pricing Toggle */}
              <div className="flex justify-center mb-12 sm:mb-16 md:mb-20">
                <ScrollBlurItem>
                  <div className="bg-white rounded-full p-1 flex">
                    <button
                      onClick={() => setIsForShoppers(true)}
                      className={`px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base font-bold transition-all duration-300 ${
                        isForShoppers 
                          ? 'bg-black text-white shadow-lg' 
                          : 'text-black hover:bg-gray-100'
                      }`}
                    >
                      For Shoppers
                    </button>
                    <button
                      onClick={() => setIsForShoppers(false)}
                      className={`px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base font-bold transition-all duration-300 ${
                        !isForShoppers 
                          ? 'bg-black text-white shadow-lg' 
                          : 'text-black hover:bg-gray-100'
                      }`}
                    >
                      For Merchants
                    </button>
                  </div>
                </ScrollBlurItem>
              </div>

              {/* Pricing Content Grid */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={isForShoppers ? "shoppers" : "merchants"}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16"
                >
                  {isForShoppers ? (
                    <>
                      {/* Left Column - Shopper Pitch */}
                <div className="space-y-8">
                  <ScrollBlurItem>
                    <div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
                              Pay nothing extra. Ever.
                      </h2>
                      <p className="text-white/80 text-base sm:text-lg leading-relaxed">
                              Shop with the freedom of flexible payments, completely interest-free. The price you see is the price you pay.
                      </p>
                    </div>
                  </ScrollBlurItem>
                      </div>

                      {/* Right Column - Shopper Pricing Card */}
                      <div className="space-y-6 sm:space-y-8">
                        <ScrollBlurItem>
                          <div className="text-center">
                            <div className="flex items-baseline justify-center mb-2">
                              <span className="text-5xl sm:text-6xl md:text-7xl font-bold text-white">0 ETB</span>
                              <span className="text-white/60 text-lg sm:text-xl ml-2">/in fees or interest</span>
                            </div>
                          </div>
                        </ScrollBlurItem>
                        <ScrollBlurItem>
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center text-white">
                              <span className="text-green-400 mr-3 text-lg">+</span>
                              <span className="text-sm sm:text-base">Split any purchase into installments</span>
                            </div>
                            <div className="flex items-center text-white">
                              <span className="text-green-400 mr-3 text-lg">+</span>
                              <span className="text-sm sm:text-base">No interest, no hidden fees, no catch</span>
                            </div>
                            <div className="flex items-center text-white">
                              <span className="text-green-400 mr-3 text-lg">+</span>
                              <span className="text-sm sm:text-base">Instant approval at checkout</span>
                            </div>
                          </div>
                        </ScrollBlurItem>
                  <ScrollBlurItem>
                          <button className="w-full bg-white text-black font-bold py-4 sm:py-5 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg">
                            Start Shopping
                          </button>
                        </ScrollBlurItem>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Left Column - Merchant Pitch */}
                      <div className="space-y-8">
                        <ScrollBlurItem>
                          <div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
                              Increase sales and reach new customers.
                            </h2>
                            <p className="text-white/80 text-base sm:text-lg leading-relaxed">
                              Offer your customers payment flexibility and get paid the full amount upfront. Meqenet takes on all the risk.
                            </p>
                    </div>
                  </ScrollBlurItem>
                </div>

                      {/* Right Column - Merchant Pricing Card */}
                <div className="space-y-6 sm:space-y-8">
                  <ScrollBlurItem>
                    <div className="text-center">
                      <div className="flex items-baseline justify-center mb-2">
                              <span className="text-5xl sm:text-6xl md:text-7xl font-bold text-white">Simple Fee</span>
                              <span className="text-white/60 text-lg sm:text-xl ml-2">/per transaction</span>
                      </div>
                    </div>
                  </ScrollBlurItem>
                  <ScrollBlurItem>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center text-white">
                        <span className="text-green-400 mr-3 text-lg">+</span>
                              <span className="text-sm sm:text-base">Receive full payment immediately</span>
                      </div>
                      <div className="flex items-center text-white">
                        <span className="text-green-400 mr-3 text-lg">+</span>
                              <span className="text-sm sm:text-base">Attract more customers and boost conversion</span>
                      </div>
                      <div className="flex items-center text-white">
                        <span className="text-green-400 mr-3 text-lg">+</span>
                              <span className="text-sm sm:text-base">Zero fraud or credit risk for you</span>
                      </div>
                    </div>
                  </ScrollBlurItem>
                  <ScrollBlurItem>
                    <button className="w-full bg-white text-black font-bold py-4 sm:py-5 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg">
                            Become a Partner
                    </button>
                  </ScrollBlurItem>
                </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Bottom Section - Additional Content */}
              <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-24 pt-6 sm:pt-8 md:pt-10 lg:pt-12 border-t border-white/10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                  {/* Left side - "Looking for more?" */}
                  <div className="lg:col-span-3">
                    <ScrollBlurItem>
                      <h3 className="text-white/60 text-sm sm:text-base font-medium">
                        Ready to grow your business?
                      </h3>
                    </ScrollBlurItem>
                  </div>
                  
                  {/* Right side - Main content */}
                  <div className="lg:col-span-9 space-y-6 sm:space-y-8">
                    <ScrollBlurItem>
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light leading-relaxed">
                        <div className="text-left">
                          <span className="text-white">Partner with Meqenet to offer flexible payments.</span>
                          <span className="text-white/70"> We provide seamless integration</span>
                        </div>
                        <div className="text-white/70 text-left">
                          and dedicated support to help you increase sales and
                        </div>
                        <div className="text-white/70 text-left">
                          build customer loyalty.
                        </div>
                      </div>
                    </ScrollBlurItem>
                    
                    {/* Profile Section */}
                    <ScrollBlurItem>
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-600">
                          <Image 
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1587&q=80" 
                            alt="Selam Tadesse"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm sm:text-base">Selam Tadesse</p>
                          <p className="text-white/60 text-xs sm:text-sm">Merchant Success Lead</p>
                        </div>
                      </div>
                    </ScrollBlurItem>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PricingSection; 

