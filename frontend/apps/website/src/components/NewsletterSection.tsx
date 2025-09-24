import React from 'react';
import Image from 'next/image';

const NewsletterSection: React.FC = () => {
  return (
    <section className="w-full flex justify-center items-center py-24 bg-transparent px-8">
      <div className="w-full max-w-[1600px] grid grid-cols-1 md:grid-cols-2 gap-[140px] items-center">
        {/* Left Side */}
        <div className="flex flex-col items-center md:items-start">
          <div className="text-center md:text-left mx-auto md:mx-0">
            <h2 className="text-3xl md:text-4xl font-medium text-gray-600 mb-8 leading-tight">
              <span className="block whitespace-nowrap">
                Stay ahead of the curve on
              </span>
              <span className="block whitespace-nowrap">
                Ethiopia&apos;s growing digital economy and
              </span>
              <span className="block whitespace-nowrap font-bold text-black">
                be the first to know about new features.
              </span>
            </h2>
          </div>
          <div className="flex items-center mt-4">
            <Image
              src="https://images.unsplash.com/photo-1600878459145-4603b3a4a639?auto=format&fit=crop&w=800&q=60"
              alt="Selamawit Gebru"
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover mr-4"
            />
            <div>
              <div className="font-bold text-black text-base">
                Selamawit Gebru
              </div>
              <div className="text-sm text-gray-500">Merchant Partnerships</div>
            </div>
          </div>
        </div>
        {/* Right Side */}
        <div className="flex flex-col items-center md:items-start w-full">
          <h3 className="text-3xl font-bold text-black mb-8">Newsletter</h3>
          <form className="w-full max-w-xl">
            <label htmlFor="newsletter-name" className="sr-only">
              Your name
            </label>
            <input
              id="newsletter-name"
              type="text"
              placeholder="Your name *"
              aria-label="Your name"
              className="w-full border-0 border-b border-gray-300 bg-transparent py-3 mb-6 text-lg focus:outline-none focus:border-black transition"
            />
            <label htmlFor="newsletter-email" className="sr-only">
              Email
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Email *"
              aria-label="Email address"
              className="w-full border-0 border-b border-gray-300 bg-transparent py-3 mb-6 text-lg focus:outline-none focus:border-black transition"
            />
            <button
              type="submit"
              className="mt-2 bg-black text-white rounded-full px-6 py-2 text-base font-semibold flex items-center gap-2"
            >
              Subscribe{' '}
              <span className="inline-block w-2 h-2 bg-white rounded-full" />
            </button>
          </form>
          <div className="mt-8 text-gray-600 text-base">
            Join our newsletter and stay updated
            <br />
            on the latest merchants and features from Meqenet.
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
