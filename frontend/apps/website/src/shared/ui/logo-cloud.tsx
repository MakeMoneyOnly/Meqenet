import React from 'react';
import { InfiniteSlider } from './infinite-slider';
import { ProgressiveBlur } from './progressive-blur';
import ScrollBlurItem from './ScrollBlurItem';
import Image from 'next/image';

interface LogoCloudProps {
  logos: {
    name: string;
    path: string;
    width: number;
    height: number;
  }[];
}

export default function LogoCloud({ logos }: LogoCloudProps) {
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
              {logos.map((logo) => (
                <div className="flex" key={logo.name}>
                  <ScrollBlurItem>
                    <Image
                      className="mx-auto h-7 w-fit grayscale opacity-80"
                      src={logo.path}
                      alt={`${logo.name} Logo`}
                      height={logo.height}
                      width={logo.width}
                    />
                  </ScrollBlurItem>
                </div>
              ))}
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
