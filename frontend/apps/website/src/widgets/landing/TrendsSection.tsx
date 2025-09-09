import React from 'react';
import Image from 'next/image';
import ScrollBlurItem from '@/shared/ui/ScrollBlurItem';
import Link from 'next/link';

const CARD_HEIGHT = 500;
const IMAGE_SIZE = 88;
const ICON_SIZE = 22;
const FEATURED_ICON_SIZE = 18;

const TrendsSection: React.FC = () => {
  const articles = [
    {
      id: 1,
      date: 'Economy | March 2024',
      title: 'The Rise of E-Commerce in Ethiopia',
      description:
        'How digital storefronts and online payments are changing the way Ethiopians shop.',
      image:
        'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=800&q=60',
    },
    {
      id: 2,
      date: 'Finance | April 2024',
      title: 'Financial Inclusion Through Technology',
      description:
        'Buy Now, Pay Later is providing accessible credit to millions of consumers.',
      image:
        'https://images.unsplash.com/photo-1604940500624-a1c1dcec3c47?auto=format&fit=crop&w=800&q=60',
    },
  ];

  return (
    <section className="relative py-16 sm:py-20 md:py-24 lg:py-28 bg-gray-50 overflow-hidden">
      <div className="relative z-10 w-[calc(100%-20px)] sm:w-[calc(100%-40px)] md:w-[calc(100%-60px)] max-w-[1520px] mx-auto">
        <div className="flex flex-row justify-between mb-10 md:mb-14 w-full">
          <div
            className="max-w-2xl flex flex-col justify-end h-full"
            style={{ minHeight: '80px' }}
          >
            <ScrollBlurItem>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                <span>Shaping the future of</span>
                <br />
                <span className="text-gray-500">Ethiopian commerce.</span>
              </h2>
            </ScrollBlurItem>
          </div>
          <div className="flex flex-col justify-end">
            <ScrollBlurItem>
              <div className="flex items-center">
                <p className="text-sm text-gray-600 mr-[500px] whitespace-nowrap">
                  Stay informed about the future of finance and
                  <br className="hidden sm:block" /> technology in Ethiopia.
                </p>
                <Link
                  href="#"
                  className="inline-flex items-center justify-center rounded-full bg-black text-white px-6 py-2 text-sm font-medium"
                >
                  Learn More
                  <svg
                    className="ml-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="12"
                      fill="white"
                      fillOpacity="0.2"
                    />
                    <path
                      d="M10.75 8.75L14.25 12L10.75 15.25"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            </ScrollBlurItem>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-[5px]">
          {/* First Article Card */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3">
            <ScrollBlurItem>
              <div
                className="relative bg-white rounded-xl overflow-hidden group flex flex-col min-h-0 p-6"
                style={{ height: `${CARD_HEIGHT}px` }}
              >
                {/* Top row: bigger image left, plus icon right */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
                    className="rounded-xl overflow-hidden bg-gray-100 flex-shrink-0"
                  >
                    <Image
                      src={articles[0].image}
                      alt="Woman silhouette"
                      width={IMAGE_SIZE}
                      height={IMAGE_SIZE}
                      className="object-cover w-full h-full rounded-xl"
                      unoptimized
                    />
                  </div>
                  <div
                    className="flex items-center justify-center ml-2"
                    style={{
                      width: ICON_SIZE,
                      height: ICON_SIZE,
                      borderRadius: ICON_SIZE / 2,
                      background: '#000',
                    }}
                  >
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
                  </div>
                </div>
                {/* Spacer to push content to bottom */}
                <div className="flex-1 min-h-0" />
                {/* Bottom content */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    {articles[0].date}
                  </p>
                  <h3 className="text-xl font-bold mb-2">
                    {articles[0].title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {articles[0].description}
                  </p>
                </div>
              </div>
            </ScrollBlurItem>
          </div>

          {/* Second Article Card */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3">
            <ScrollBlurItem>
              <div
                className="relative bg-white rounded-xl overflow-hidden group flex flex-col min-h-0 p-6"
                style={{ height: `${CARD_HEIGHT}px` }}
              >
                {/* Top row: bigger image left, plus icon right */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
                    className="rounded-xl overflow-hidden bg-gray-100 flex-shrink-0"
                  >
                    <Image
                      src={articles[1].image}
                      alt="Abstract art with red lines"
                      width={IMAGE_SIZE}
                      height={IMAGE_SIZE}
                      className="object-cover w-full h-full rounded-xl"
                      unoptimized
                    />
                  </div>
                  <div
                    className="flex items-center justify-center ml-2"
                    style={{
                      width: ICON_SIZE,
                      height: ICON_SIZE,
                      borderRadius: ICON_SIZE / 2,
                      background: '#000',
                    }}
                  >
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
                  </div>
                </div>
                {/* Spacer to push content to bottom */}
                <div className="flex-1 min-h-0" />
                {/* Bottom content */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    {articles[1].date}
                  </p>
                  <h3 className="text-xl font-bold mb-2">
                    {articles[1].title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {articles[1].description}
                  </p>
                </div>
              </div>
            </ScrollBlurItem>
          </div>

          {/* Featured Article Card */}
          <div className="col-span-12 md:col-span-4 lg:col-span-6">
            <ScrollBlurItem>
              <div
                className="relative bg-white rounded-xl overflow-hidden group h-full"
                style={{ height: `${CARD_HEIGHT}px` }}
              >
                <div className="h-full relative overflow-hidden flex flex-col min-h-0">
                  <Image
                    src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=60"
                    alt="Team discussing digital strategy"
                    width={800}
                    height={400}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-6">
                    <div className="absolute top-4 left-6">
                      <span className="text-white text-sm font-medium">
                        meqenet®
                      </span>
                    </div>
                    <div
                      className="absolute top-4 right-4"
                      style={{
                        width: `${FEATURED_ICON_SIZE}px`,
                        height: `${FEATURED_ICON_SIZE}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
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
                    </div>
                    <h3 className="text-4xl font-bold text-white mb-2">
                      Digital Ethiopia
                      <br />
                      2025
                    </h3>
                  </div>
                </div>
              </div>
            </ScrollBlurItem>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrendsSection;
