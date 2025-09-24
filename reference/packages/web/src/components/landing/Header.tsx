'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div 
        ref={headerRef}
        className={`relative w-full bg-white transition-all duration-300 z-50 ${isScrolled ? 'shadow-md' : 'shadow-none'}`}
      >
        {/* Top bar */}
        <div className="bg-white h-5 flex items-center justify-center text-xs font-medium">
          <div className="flex items-center space-x-6">
            <a href="#" className="font-bold text-black">For shoppers</a>
            <a href="#" className="text-gray-500 hover:text-black">For business</a>
          </div>
        </div>

        {/* Main Header */}
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-1">
          {/* Mobile Header */}
          <div className="flex items-center justify-between w-full h-full lg:hidden">
            <Link href="/" className="flex items-center">
              <Image src="/images/meqenet.png" alt="Meqenet Logo" width={210} height={25} className="object-contain" />
            </Link>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <svg width="28" height="14" viewBox="0 0 28 14" fill="none" className="text-black">
                <path d="M0 7h28M0 1h28M0 13h28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Desktop Header */}
          <div className={`hidden lg:flex items-center justify-between w-full h-full transition-opacity duration-300`}>
            {/* Left: Nav Links */}
            <nav className="flex items-center space-x-6">
              <a href="#how-it-works" className="font-aeonik text-[14px] text-black hover:text-gray-600 transition-colors duration-200">How It Works</a>
              <a href="#shop" className="font-aeonik text-[14px] text-black hover:text-gray-600 transition-colors duration-200">Shop</a>
              <a href="#for-business" className="font-aeonik text-[14px] text-black hover:text-gray-600 transition-colors duration-200">For Business</a>
              <a href="#help" className="font-aeonik text-[14px] text-black hover:text-gray-600 transition-colors duration-200">Help</a>
            </nav>
            {/* Center: Logo */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Link href="/" className="flex items-center">
                <Image src="/images/meqenet.png" alt="Meqenet Logo" width={250} height={35} className="object-contain" />
              </Link>
            </div>
            {/* Right: Sign In and Menu */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative flex items-center h-8">
                <AnimatePresence>
                  {isSearchOpen ? (
                    <motion.div
                      key="search-input"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: '20rem', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="relative flex items-center"
                    >
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search for any product or brand"
                        className="w-full h-8 pl-10 pr-8 rounded-full bg-gray-100 text-black font-aeonik text-[13px] focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-500"
                        onBlur={() => setIsSearchOpen(false)}
                      />
                      <svg
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <button
                        onClick={() => setIsSearchOpen(false)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-black transition-colors"
                        aria-label="Close search"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="search-button"
                      onClick={() => setIsSearchOpen(true)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Open search"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <svg
                        className="w-4 h-4 text-gray-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              {/* Sign In Button */}
              <button className="flex items-center space-x-2 px-3 h-8 rounded-full bg-gray-100 text-black font-aeonik text-[13px] font-medium shadow-none hover:bg-gray-200 transition-colors">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8ZM2 14C2 11.7909 4.68629 10 8 10C11.3137 10 14 11.7909 14 14H2Z" fill="currentColor"/>
                </svg>
                <span>Sign in</span>
              </button>
              {/* Hamburger Menu */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 transition-colors duration-200"
                aria-label="Toggle menu"
              >
                <svg width="24" height="12" viewBox="0 0 28 14" fill="none" className="text-black">
                  <path d="M0 7h28M0 1h28M0 13h28" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Page Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ duration: 0.9, ease: [0.83, 0, 0.17, 1] }}
              className="fixed top-0 left-0 right-0 bg-white z-40 shadow-2xl rounded-b-2xl"
            >
              <div 
                className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col"
                style={{ paddingTop: headerHeight }}
              >
                {/* Middle: Content */}
                <main className="py-10 text-left pb-16">
                  <div className="relative mb-12">
                    <h1 className="font-aeonik text-6xl sm:text-7xl font-bold tracking-tighter text-black">
                      Menu.
                    </h1>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-10 text-left max-w-7xl">
                    {/* Left Column: Navigation */}
                    <div>
                      <nav className="flex flex-col space-y-10">
                        {/* Account Section */}
                        <div className="flex flex-col space-y-4">
                          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Account</h2>
                          <a href="#" onClick={() => setIsMenuOpen(false)} className="font-aeonik text-2xl font-medium text-gray-700 hover:text-black transition-colors">Profile & Settings</a>
                          <a href="#" onClick={() => setIsMenuOpen(false)} className="font-aeonik text-2xl font-medium text-gray-700 hover:text-black transition-colors">Order History</a>
                          <a href="#" onClick={() => setIsMenuOpen(false)} className="font-aeonik text-2xl font-medium text-gray-700 hover:text-black transition-colors">Payment Methods</a>
                        </div>
                        
                        {/* Shopping Section */}
                        <div className="flex flex-col space-y-4">
                          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Shopping</h2>
                          <a href="#" onClick={() => setIsMenuOpen(false)} className="font-aeonik text-2xl font-medium text-gray-700 hover:text-black transition-colors">Shop Directory</a>
                          <a href="#" onClick={() => setIsMenuOpen(false)} className="font-aeonik text-2xl font-medium text-gray-700 hover:text-black transition-colors">How It Works</a>
                        </div>
                          
                        {/* Support Section */}
                        <div className="flex flex-col space-y-4">
                          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Support</h2>
                          <a href="#" onClick={() => setIsMenuOpen(false)} className="font-aeonik text-2xl font-medium text-gray-700 hover:text-black transition-colors">Help Center</a>
                          <a href="#" onClick={() => setIsMenuOpen(false)} className="font-aeonik text-2xl font-medium text-gray-700 hover:text-black transition-colors">Contact Us</a>
                        </div>
                      </nav>
                    </div>
                    
                    {/* Right Column: BNPL Feature Highlight */}
                    <div className="hidden md:block relative">
                      <div className="h-full flex flex-col">
                        {/* Main Content: Layout */}
                        <div className="flex flex-col md:flex-row items-center">
                          {/* Text Content - Better positioned with proper size */}
                          <div className="w-full md:w-1/4 mb-8 md:mb-0 md:self-center">
                            <div className="md:max-w-xs">
                              <h3 className="font-aeonik text-2xl font-bold leading-tight">
                                <span className="block whitespace-nowrap">Pay your way,</span>
                                <span className="block">anytime</span>
                              </h3>
                              <p className="text-gray-600 text-sm leading-normal mt-2">Seamless shopping with flexible payments at your fingertips — the smarter way to buy.</p>
                            </div>
                          </div>
                          
                          {/* App Image and CTA - Extra large */}
                          <div className="w-full md:w-3/4">
                            <div className="relative">
                              <Image
                                src="/images/menu.png"
                                alt="Meqenet BNPL App Interface"
                                width={800}
                                height={600}
                                className="w-full h-auto transform scale-150"
                                style={{ transformOrigin: 'center' }}
                              />
                              
                              {/* CTA Button - Extra fancy, elegant design - moved up */}
                              <div className="mt-[-12px] flex justify-center">
                                <a href="#" className="group inline-flex items-center text-xs font-medium text-gray-700 hover:text-black transition-all duration-300 relative px-1 py-0.5">
                                  <span className="tracking-wider uppercase">Download the app</span>
                                  <svg className="ml-1 w-3 h-3 transform group-hover:translate-x-1 transition-all duration-300 ease-out" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                  <span className="absolute bottom-0 left-0 w-0 h-px bg-black group-hover:w-full transition-all duration-300 ease-out"></span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header; 
