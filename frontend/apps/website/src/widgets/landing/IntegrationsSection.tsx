import React from 'react';
import {
  Gemini,
  Replit,
  MagicUI,
  VSCodium,
  MediaWiki,
  GooglePaLM,
} from '@/components/logos';
import { LogoIcon } from '@/components/logo';
import { cn } from '@/shared/utils';
import { Button } from '@/shared/ui/button';
import Link from 'next/link';
import ScrollBlurItem from '@/shared/ui/ScrollBlurItem';

export default function IntegrationsSection() {
  return (
    <section className="relative min-h-screen bg-gray-50 py-4 overflow-hidden">
      {/* Main Content Container - Equal spacing on both sides */}
      <div className="relative z-10 w-full h-[calc(100vh-25px)] px-2">
        {/* Black Card - Similar to hero card */}
        <div className="relative w-full h-full overflow-hidden rounded-3xl bg-black shadow-2xl">
          {/* Integration Content - Centered inside black card */}
          <div className="absolute inset-0 flex flex-col justify-center items-center p-8 md:p-16">
            <div className="w-full max-w-4xl">
              <div className="text-center mb-10">
                <ScrollBlurItem>
                  <h2 className="text-balance text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                    Integrate with your favorite tools
                  </h2>
                </ScrollBlurItem>
                <ScrollBlurItem>
                  <p className="text-white/80 mt-4 text-balance">
                    Connect seamlessly with popular platforms and services to
                    enhance your workflow.
                  </p>
                </ScrollBlurItem>
              </div>

              <div className="relative mx-auto w-fit mb-10">
                <div className="mx-auto mb-2 flex w-fit justify-center gap-2">
                  <IntegrationCard>
                    <Gemini />
                  </IntegrationCard>
                  <IntegrationCard>
                    <Replit />
                  </IntegrationCard>
                </div>
                <div className="mx-auto my-2 flex w-fit justify-center gap-2">
                  <IntegrationCard>
                    <MagicUI />
                  </IntegrationCard>
                  <IntegrationCard
                    borderClassName="shadow-black-950/10 shadow-xl border-black/25"
                    className="bg-white"
                  >
                    <LogoIcon />
                  </IntegrationCard>
                  <IntegrationCard>
                    <VSCodium />
                  </IntegrationCard>
                </div>

                <div className="mx-auto flex w-fit justify-center gap-2">
                  <IntegrationCard>
                    <MediaWiki />
                  </IntegrationCard>

                  <IntegrationCard>
                    <GooglePaLM />
                  </IntegrationCard>
                </div>
              </div>

              <div className="mx-auto text-center">
                <ScrollBlurItem>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white text-black hover:bg-gray-100"
                    asChild
                  >
                    <Link href="#">Get Started</Link>
                  </Button>
                </ScrollBlurItem>
              </div>
            </div>
          </div>

          {/* Copyright/Attribution - Professional styling */}
          <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 text-white/60 text-sm z-40 tracking-wide">
            <ScrollBlurItem>© 2024 meqenet BNPL</ScrollBlurItem>
          </div>
        </div>
      </div>
    </section>
  );
}

const IntegrationCard = ({
  children,
  className,
  borderClassName,
}: {
  children: React.ReactNode;
  className?: string;
  borderClassName?: string;
}) => {
  return (
    <div
      className={cn(
        'bg-white relative flex size-20 rounded-xl shadow-sm',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 rounded-xl border border-black/10',
          borderClassName,
        )}
      />
      <div className="relative z-20 m-auto size-fit *:size-8">{children}</div>
    </div>
  );
};
