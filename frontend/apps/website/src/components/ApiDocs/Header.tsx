import React from 'react';
// import Link from 'next/link';

export default function ApiDocsHeader() {
  return (
    <header className="w-full bg-gradient-to-br from-[#e8f8f3] via-[#f7fafc] to-[#e8f8f3] border-b border-gray-200 shadow-sm sticky top-0 left-0 z-50 font-[Aeonik,Manrope,sans-serif]">
      <div
        className="max-w-6xl mx-auto flex items-center justify-between px-8 py-1.5"
        style={{ fontFamily: 'Aeonik, Manrope, sans-serif' }}
      >
        {/* Logo and Brand */}
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="12" width="24" height="8" rx="4" fill="#6EE7B7" />
            <rect x="12" y="4" width="8" height="24" rx="4" fill="#34D399" />
          </svg>
          <span
            className="ml-2 text-2xl font-bold text-black"
            style={{ fontFamily: 'Aeonik, Manrope, sans-serif' }}
          >
            Meqenet
          </span>
        </div>
        {/* Centered Search Bar */}
        <div className="flex-1 flex justify-center">
          <label htmlFor="api-search" className="sr-only">
            Search API documentation
          </label>
          <input
            id="api-search"
            type="text"
            placeholder="Search..."
            className="w-96 px-4 py-2 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 text-base shadow-sm font-normal"
            style={{ fontFamily: 'Aeonik, Manrope, sans-serif' }}
            disabled
            aria-label="Search API documentation"
          />
        </div>
        {/* Register Button (placeholder) */}
        <div>
          <button
            className="bg-[#10b981] hover:bg-[#059669] text-white font-bold px-6 py-2 rounded-full shadow transition text-base"
            style={{ fontFamily: 'Aeonik, Manrope, sans-serif' }}
          >
            Register
          </button>
        </div>
      </div>
    </header>
  );
}
