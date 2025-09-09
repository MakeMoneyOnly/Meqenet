import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import Image from 'next/image';
import ScrollBlurItem from '@/components/ui/ScrollBlurItem';

export default function Features() {
  return (
    <section className="py-8">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto grid gap-2 sm:grid-cols-5">
          <Card className="group overflow-hidden shadow-zinc-950/5 sm:col-span-3 sm:rounded-none sm:rounded-tl-xl bg-white text-black">
            <CardHeader>
              <div className="md:p-6">
                <ScrollBlurItem>
                  <p className="font-medium">Flexible Installments</p>
                </ScrollBlurItem>
                <ScrollBlurItem>
                  <p className="text-muted-foreground mt-3 max-w-sm text-sm">
                    Split your purchases into easy, interest-free payments.
                    Enjoy shopping without the burden of upfront costs.
                  </p>
                </ScrollBlurItem>
              </div>
            </CardHeader>

            <div className="relative h-fit pl-6 md:pl-12">
              <div className="absolute -inset-6 [background:radial-gradient(75%_95%_at_50%_0%,transparent,var(--color-background)_100%)]" />

              <div className="bg-background overflow-hidden rounded-tl-lg border-l border-t pl-2 pt-2 dark:bg-zinc-950">
                <ScrollBlurItem>
                  <Image
                    src="/mail2.png"
                    className="hidden dark:block"
                    alt="Flexible Installments illustration dark"
                    width={1207}
                    height={929}
                  />
                </ScrollBlurItem>
                <ScrollBlurItem>
                  <Image
                    src="/mail2-light.png"
                    className="shadow dark:hidden"
                    alt="Flexible Installments illustration light"
                    width={1207}
                    height={929}
                  />
                </ScrollBlurItem>
              </div>
            </div>
          </Card>

          <Card className="group overflow-hidden shadow-zinc-950/5 sm:col-span-2 sm:rounded-none sm:rounded-tr-xl bg-white text-black">
            <ScrollBlurItem>
              <p className="mx-auto my-6 max-w-md text-balance px-6 text-center text-lg font-semibold sm:text-2xl md:p-6">
                Instant Approval
              </p>
            </ScrollBlurItem>

            <CardContent className="mt-auto h-fit">
              <div className="relative mb-6 sm:mb-0">
                <div className="absolute -inset-6 [background:radial-gradient(50%_75%_at_75%_50%,transparent,var(--color-background)_100%)]" />
                <div className="aspect-76/59 overflow-hidden rounded-r-lg border">
                  <ScrollBlurItem>
                    <Image
                      src="/origin-cal-dark.png"
                      className="hidden dark:block"
                      alt="Instant Approval illustration dark"
                      width={1207}
                      height={929}
                    />
                  </ScrollBlurItem>
                  <ScrollBlurItem>
                    <Image
                      src="/origin-cal.png"
                      className="shadow dark:hidden"
                      alt="Instant Approval illustration light"
                      width={1207}
                      height={929}
                    />
                  </ScrollBlurItem>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="group p-6 shadow-zinc-950/5 sm:col-span-2 sm:rounded-none sm:rounded-bl-xl md:p-12 bg-white text-black">
            <ScrollBlurItem>
              <p className="mx-auto mb-12 max-w-md text-balance text-center text-lg font-semibold sm:text-2xl">
                No Hidden Fees
              </p>
            </ScrollBlurItem>

            <div className="flex justify-center gap-6">
              <ScrollBlurItem>
                <div className="inset-shadow-sm dark:inset-shadow-white/5 bg-muted/35 relative flex aspect-square size-16 items-center rounded-[7px] border p-3 shadow-lg ring dark:shadow-white/5 dark:ring-black">
                  <span className="absolute right-2 top-1 block text-sm">
                    ETB
                  </span>
                  <Globe className="mt-auto size-4" />
                </div>
              </ScrollBlurItem>
              <ScrollBlurItem>
                <div className="inset-shadow-sm dark:inset-shadow-white/5 bg-muted/35 flex aspect-square size-16 items-center justify-center rounded-[7px] border p-3 shadow-lg ring dark:shadow-white/5 dark:ring-black">
                  <span>✓</span>
                </div>
              </ScrollBlurItem>
            </div>
          </Card>
          <Card className="group relative shadow-zinc-950/5 sm:col-span-3 sm:rounded-none sm:rounded-br-xl bg-white text-black">
            <CardHeader className="p-6 md:p-12">
              <ScrollBlurItem>
                <p className="font-medium">Partnered Merchants</p>
              </ScrollBlurItem>
              <ScrollBlurItem>
                <p className="text-muted-foreground mt-2 max-w-sm text-sm">
                  Shop at top Ethiopian stores and enjoy exclusive BNPL offers.
                  We&apos;re growing our network every day.
                </p>
              </ScrollBlurItem>
            </CardHeader>
            <CardContent className="relative h-fit px-6 pb-6 md:px-12 md:pb-12">
              <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
                <div className="rounded-(--radius) aspect-square border border-dashed" />
                <div className="rounded-(--radius) bg-muted/50 flex aspect-square items-center justify-center border p-4">
                  <ScrollBlurItem>
                    <Image
                      className="m-auto size-8 invert dark:invert-0"
                      src="https://oxymor-ns.tailus.io/logos/linear.svg"
                      alt="Merchant logo"
                      width={32}
                      height={32}
                    />
                  </ScrollBlurItem>
                </div>
                <div className="rounded-(--radius) aspect-square border border-dashed" />
                <div className="rounded-(--radius) bg-muted/50 flex aspect-square items-center justify-center border p-4">
                  <ScrollBlurItem>
                    <Image
                      className="m-auto size-8 invert dark:invert-0"
                      src="https://oxymor-ns.tailus.io/logos/netlify.svg"
                      alt="Merchant logo"
                      width={32}
                      height={32}
                    />
                  </ScrollBlurItem>
                </div>
                <div className="rounded-(--radius) aspect-square border border-dashed" />
                <div className="rounded-(--radius) bg-muted/50 flex aspect-square items-center justify-center border p-4">
                  <ScrollBlurItem>
                    <Image
                      className="m-auto size-8 invert dark:invert-0"
                      src="https://oxymor-ns.tailus.io/logos/github.svg"
                      alt="Merchant logo"
                      width={32}
                      height={32}
                    />
                  </ScrollBlurItem>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
