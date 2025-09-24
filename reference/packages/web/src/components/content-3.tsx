import { Button } from '@/components/common/ui/button'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ScrollBlurItem from '@/components/common/ui/ScrollBlurItem'

export default function ContentSection() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-12">
                <ScrollBlurItem>
                <Image
                    className="rounded-xl grayscale"
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=60"
                    alt="Merchants collaborating"
                    height={400}
                    width={800}
                    loading="lazy"
                />
                </ScrollBlurItem>

                <div className="grid gap-6 md:grid-cols-2 md:gap-12">
                    <ScrollBlurItem>
                    <h2 className="text-4xl font-medium">Boost Your Sales. Get Paid Instantly.</h2>
                    </ScrollBlurItem>
                    <div className="space-y-6">
                        <ScrollBlurItem>
                        <p>Join the growing network of Meqenet partner merchants and offer your customers the payment flexibility they want. Increase your conversion rates, boost average order value, and receive the full payment upfront. We handle the risk, so you can focus on your business.</p>
                        </ScrollBlurItem>

                        <ScrollBlurItem>
                        <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="gap-1 pr-1.5">
                            <Link href="#">
                                <span>Become a Merchant Partner</span>
                                <ChevronRight className="size-2" />
                            </Link>
                        </Button>
                        </ScrollBlurItem>
                    </div>
                </div>
            </div>
        </section>
    )
}
