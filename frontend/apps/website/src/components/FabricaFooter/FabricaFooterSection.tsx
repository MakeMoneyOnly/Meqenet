import React from 'react';

/**
 * Pixel-perfect clone of the "fabrica®" footer section as shown in the screenshot.
 * Layout: Top row (Contact, Navigation, Social), Centered fabrica® Studio, Bottom black bar.
 * No scroll past the black footer.
 */
const FabricaFooterSection: React.FC = () => {
  return (
    <div className="w-full min-h-screen flex flex-col justify-between bg-[#f7f9f8]">
      {/* Top Row */}
      <div className="w-full max-w-[1700px] mx-auto flex flex-row justify-between items-start pt-16 px-12">
        {/* Contact (left) */}
        <div className="flex flex-col items-start min-w-[320px]">
          <div className="text-[15px] font-normal mb-2">(312) 555-2468</div>
          <div className="flex items-center text-[32px] font-bold mb-2">
            <span className="inline-block w-5 h-5 rounded-full bg-black mr-2 flex items-center justify-center">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 0V12" stroke="white" strokeWidth="2" />
                <path d="M0 6H12" stroke="white" strokeWidth="2" />
              </svg>
            </span>
            <a
              href="mailto:hello@fabrica.com"
              className="underline decoration-2 underline-offset-4 hover:text-gray-700 transition-colors"
            >
              hello@fabrica.com
            </a>
          </div>
        </div>
        {/* Navigation (center) */}
        <div className="flex flex-row gap-32">
          <div className="min-w-[120px]">
            <div className="text-xs text-gray-500 mb-2">Navigation</div>
            <ul className="space-y-1 text-lg font-medium">
              <li>
                <a href="/" className="hover:underline">
                  Home
                </a>
              </li>
              <li>
                <a href="/studio" className="hover:underline">
                  Studio
                </a>
              </li>
              <li>
                <a href="/projects" className="hover:underline">
                  Projects
                </a>
              </li>
              <li>
                <a href="/blog" className="hover:underline">
                  Blog
                </a>
              </li>
            </ul>
          </div>
          {/* Social (right) */}
          <div className="min-w-[120px]">
            <div className="text-xs text-gray-500 mb-2">Social</div>
            <ul className="space-y-1 text-lg font-medium">
              <li>
                <a
                  href="https://twitter.com/fabrica"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center"
                >
                  Twitter <span className="ml-1">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/fabrica"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center"
                >
                  Instagram <span className="ml-1">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://dribbble.com/fabrica"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center"
                >
                  Dribbble <span className="ml-1">↗</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      {/* Centered fabrica® Studio */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <span className="text-[160px] leading-[0.9] font-bold tracking-tight text-black select-none">
          fabrica<sup className="text-[60px] align-super">®</sup>
        </span>
        <span className="text-[40px] font-light mt-2">Studio</span>
      </div>
      {/* Black Footer Bar */}
      <footer className="w-full bg-black text-white text-xs flex flex-row items-center justify-between px-12 py-3">
        <span>© 2025 fabrica® Studio. All rights reserved.</span>
        <div className="flex flex-row gap-8">
          <a href="/privacy-policy" className="hover:underline">
            Privacy Policy
          </a>
          <a href="/terms-of-service" className="hover:underline">
            Terms of Service
          </a>
          <span className="flex items-center gap-1">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 2v20M2 12h20"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>{' '}
            Built in Framer
          </span>
        </div>
        <span>
          Created by <span className="font-semibold">Anatolii Dmtrienko</span>
        </span>
        <button className="ml-4 bg-white text-black rounded-full px-4 py-1 text-xs font-semibold border border-black">
          Buy template
        </button>
        <button className="ml-2 bg-white text-black rounded-full px-4 py-1 text-xs font-semibold border border-black flex items-center gap-1">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <rect width="24" height="24" rx="6" fill="#000" />
            <path d="M7 12h10M12 7v10" stroke="#fff" strokeWidth="2" />
          </svg>
          Made in Framer
        </button>
      </footer>
    </div>
  );
};

export default FabricaFooterSection;
