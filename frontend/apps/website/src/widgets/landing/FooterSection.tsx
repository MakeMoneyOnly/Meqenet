import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full relative pb-20">
      {/* Top Contact/Nav/Social Row */}
      <div className="w-full max-w-[1700px] mx-auto flex flex-row justify-between items-start px-12 pt-24 pb-0">
        {/* Contact (left) */}
        <div className="flex flex-col items-start min-w-[320px]">
          <span className="text-gray-300 text-2xl mb-8">+</span>
          <div className="text-[15px] font-normal mb-2">(251) 91 123 4567</div>
          <div className="flex items-center text-[32px] font-bold mb-2">
            <span className="inline-block w-7 h-7 rounded-full bg-black mr-2 flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 0V12" stroke="white" strokeWidth="2" />
                <path d="M0 6H12" stroke="white" strokeWidth="2" />
              </svg>
            </span>
            <a
              href="mailto:hello@meqenet.com"
              className="underline decoration-2 underline-offset-4 hover:text-gray-700 transition-colors"
            >
              hello@meqenet.com
            </a>
          </div>
        </div>
        {/* Navigation (center left) */}
        <div className="flex flex-col items-start min-w-[220px] ml-32">
          <span className="text-gray-300 text-2xl mb-8">+</span>
          <div className="text-xs text-gray-500 mb-2">Navigation</div>
          <ul className="space-y-1 text-[22px] font-medium">
            <li>
              <a href="#features" className="hover:underline">
                Features
              </a>
            </li>
            <li>
              <a href="#merchants" className="hover:underline">
                Merchants
              </a>
            </li>
            <li>
              <a href="/docs" className="hover:underline">
                API
              </a>
            </li>
            <li>
              <a href="#support" className="hover:underline">
                Support
              </a>
            </li>
          </ul>
        </div>
        {/* Social (center right) */}
        <div className="flex flex-col items-start min-w-[220px] ml-32">
          <span className="text-gray-300 text-2xl mb-8">+</span>
          <div className="text-xs text-gray-500 mb-2">Social</div>
          <ul className="space-y-1 text-[22px] font-medium">
            <li>
              <a
                href="/social/twitter"
                className="hover:underline flex items-center"
              >
                Twitter <span className="ml-1 text-base">↗</span>
              </a>
            </li>
            <li>
              <a
                href="/social/instagram"
                className="hover:underline flex items-center"
              >
                Instagram <span className="ml-1 text-base">↗</span>
              </a>
            </li>
            <li>
              <a
                href="/social/dribbble"
                className="hover:underline flex items-center"
              >
                Dribbble <span className="ml-1 text-base">↗</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      {/* Large fabrica® Studio Section - right aligned */}
      <div
        className="w-full flex flex-row justify-end items-center pr-24"
        style={{ minHeight: '340px' }}
      >
        <div className="flex flex-col items-start">
          <span className="text-[180px] leading-[0.9] font-bold tracking-tight text-black select-none">
            meqenet<sup className="text-[60px] align-super">®</sup>
          </span>
          <span className="text-[48px] font-light mt-2 ml-4">Studio</span>
        </div>
      </div>
      {/* Black Footer Bar - full width, fixed at bottom */}
      <div className="fixed left-0 right-0 bottom-0 w-full bg-black text-white text-xs flex flex-row items-center justify-between px-12 py-12 z-50">
        <span>© 2024 meqenet®. All rights reserved.</span>
        <div className="flex flex-row gap-8">
          <a href="/privacy-policy" className="hover:underline">
            Privacy Policy
          </a>
          <a href="/terms-of-service" className="hover:underline">
            Terms of Service
          </a>
          <a href="/cookie-policy" className="hover:underline">
            Cookie Policy
          </a>
          <a href="/legal-notice" className="hover:underline">
            Legal Notice
          </a>
        </div>
        {/* Empty div for spacing */}
        <div />
      </div>
    </footer>
  );
};

export default Footer;
