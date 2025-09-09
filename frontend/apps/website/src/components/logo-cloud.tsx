import React from 'react';
import { InfiniteSlider } from './ui/infinite-slider';
import { ProgressiveBlur } from './ui/progressive-blur';
import ScrollBlurItem from './ui/ScrollBlurItem';
import Image from 'next/image';

export default function LogoCloud() {
  return (
    <section className="overflow-hidden py-2">
      <div className="group relative m-auto max-w-7xl">
        <div className="flex flex-col items-center md:flex-row">
          <div className="md:max-w-40 md:border-r md:pr-6 md:mr-4">
            <ScrollBlurItem>
              <p className="text-end text-sm text-gray-600 font-light">
                Trusted by leading merchants and partners
              </p>
            </ScrollBlurItem>
          </div>
          <div className="relative py-5 md:w-[calc(100%-11rem)]">
            <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
              <div className="flex">
                <ScrollBlurItem>
                  <Image
                    className="mx-auto h-7 w-fit grayscale opacity-80"
                    src="https://html.tailus.io/blocks/customers/nvidia.svg"
                    alt="Nvidia Logo"
                    height={28}
                    width={100}
                  />
                </ScrollBlurItem>
              </div>
              <div className="flex">
                <ScrollBlurItem>
                  <Image
                    className="mx-auto h-6 w-fit grayscale opacity-80"
                    src="https://html.tailus.io/blocks/customers/column.svg"
                    alt="Column Logo"
                    height={24}
                    width={100}
                  />
                </ScrollBlurItem>
              </div>
              <div className="flex">
                <ScrollBlurItem>
                  <Image
                    className="mx-auto h-6 w-fit grayscale opacity-80"
                    src="https://html.tailus.io/blocks/customers/github.svg"
                    alt="GitHub Logo"
                    height={24}
                    width={100}
                  />
                </ScrollBlurItem>
              </div>
              <div className="flex">
                <ScrollBlurItem>
                  <Image
                    className="mx-auto h-7 w-fit grayscale opacity-80"
                    src="https://html.tailus.io/blocks/customers/nike.svg"
                    alt="Nike Logo"
                    height={28}
                    width={100}
                  />
                </ScrollBlurItem>
              </div>
              <div className="flex">
                <ScrollBlurItem>
                  <Image
                    className="mx-auto h-7 w-fit grayscale opacity-80"
                    src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                    alt="Lemon Squeezy Logo"
                    height={28}
                    width={100}
                  />
                </ScrollBlurItem>
              </div>
              <div className="flex">
                <ScrollBlurItem>
                  <Image
                    className="mx-auto h-6 w-fit grayscale opacity-80"
                    src="https://html.tailus.io/blocks/customers/laravel.svg"
                    alt="Laravel Logo"
                    height={24}
                    width={100}
                  />
                </ScrollBlurItem>
              </div>
              <div className="flex">
                <ScrollBlurItem>
                  <Image
                    className="mx-auto h-8 w-fit grayscale opacity-80"
                    src="https://html.tailus.io/blocks/customers/lilly.svg"
                    alt="Lilly Logo"
                    height={32}
                    width={100}
                  />
                </ScrollBlurItem>
              </div>
              <div className="flex">
                <ScrollBlurItem>
                  <Image
                    className="mx-auto h-8 w-fit grayscale opacity-80"
                    src="https://html.tailus.io/blocks/customers/openai.svg"
                    alt="OpenAI Logo"
                    height={32}
                    width={100}
                  />
                </ScrollBlurItem>
              </div>
            </InfiniteSlider>
            <ProgressiveBlur
              className="pointer-events-none absolute left-0 top-0 h-full w-16"
              direction="left"
              blurIntensity={0.15}
            />
            <ProgressiveBlur
              className="pointer-events-none absolute right-0 top-0 h-full w-16"
              direction="right"
              blurIntensity={0.15}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
