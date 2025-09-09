'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import Link from 'next/link';
import ScrollBlurItem from './ui/ScrollBlurItem';

export default function FAQsTwo() {
  const faqItems = [
    {
      id: 'item-1',
      question: 'How does Buy Now, Pay Later work in Ethiopia?',
      answer:
        'With Meqenet, you can shop at partner merchants and split your purchase into manageable, interest-free installments. Pay a portion upfront and the rest over time.',
    },
    {
      id: 'item-2',
      question: 'Who is eligible for Meqenet?',
      answer:
        'Anyone with a valid Ethiopian phone number and ID can apply. Approval is instant and requires no paperwork.',
    },
    {
      id: 'item-3',
      question: 'Which merchants accept Meqenet?',
      answer:
        'Meqenet is accepted at a growing network of Ethiopian merchants, both online and in-store. Look for the Meqenet logo or ask at checkout.',
    },
    {
      id: 'item-4',
      question: 'Are there any fees or interest?',
      answer:
        'Meqenet is 100% interest-free with no hidden fees. You only pay the amount you see at checkout, split into installments.',
    },
    {
      id: 'item-5',
      question: 'How do I pay my installments?',
      answer:
        "You can pay your installments using local payment methods such as Telebirr, CBE Birr, or your preferred bank. We'll send you reminders before each due date.",
    },
  ];

  return (
    <section className="relative min-h-screen bg-gray-50 py-4 overflow-hidden">
      {/* Main Content Container - Equal spacing on both sides */}
      <div className="relative z-10 w-full h-[calc(100vh-25px)] px-2">
        {/* Black Card - Similar to hero card */}
        <div className="relative w-full h-full overflow-hidden rounded-3xl bg-black shadow-2xl">
          {/* FAQ Content - Centered inside black card */}
          <div className="absolute inset-0 flex flex-col justify-center items-center p-8 md:p-16">
            <div className="w-full max-w-4xl">
              <div className="text-center mb-10">
                <ScrollBlurItem>
                  <h2 className="text-balance text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                    Frequently Asked Questions
                  </h2>
                </ScrollBlurItem>
                <ScrollBlurItem>
                  <p className="text-white/80 mt-4 text-balance">
                    Discover quick and comprehensive answers to common questions
                    about our platform, services, and features.
                  </p>
                </ScrollBlurItem>
              </div>

              <div className="mx-auto">
                <Accordion
                  type="single"
                  collapsible
                  className="bg-white w-full rounded-2xl border border-white/10 px-8 py-3 shadow-lg"
                >
                  {faqItems.map((item) => (
                    <AccordionItem
                      key={item.id}
                      value={item.id}
                      className="border-gray-200 border-dashed"
                    >
                      <ScrollBlurItem>
                        <AccordionTrigger className="cursor-pointer text-base text-black hover:text-gray-700 hover:no-underline">
                          {item.question}
                        </AccordionTrigger>
                      </ScrollBlurItem>
                      <AccordionContent>
                        <ScrollBlurItem>
                          <p className="text-base text-gray-800">
                            {item.answer}
                          </p>
                        </ScrollBlurItem>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <ScrollBlurItem>
                  <p className="text-white/60 mt-6 px-8">
                    Can&apos;t find what you&apos;re looking for? Contact our{' '}
                    <Link
                      href="#"
                      className="text-green-400 font-medium hover:underline"
                    >
                      customer support team
                    </Link>
                  </p>
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
