import React, { useState } from 'react';
import ScrollBlurItem from '@/shared/ui/ScrollBlurItem';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-[5px]">
      <button
        className="w-full flex justify-between items-center py-5 px-8 bg-white rounded-xl text-left focus:outline-none transition-all duration-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-base sm:text-lg font-medium">{question}</span>
        <span className="ml-6 flex-shrink-0">
          <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
            {isOpen ? (
              <svg
                width="8"
                height="2"
                viewBox="0 0 12 2"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="12" height="2" fill="white" />
              </svg>
            ) : (
              <svg
                width="8"
                height="8"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 0V12" stroke="white" strokeWidth="2" />
                <path d="M0 6H12" stroke="white" strokeWidth="2" />
              </svg>
            )}
          </div>
        </span>
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              opacity: { duration: 0.3 },
            }}
            className="overflow-hidden"
          >
            <div className="px-8 py-5 bg-white rounded-b-xl border-t border-gray-100">
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-gray-600 text-sm sm:text-base"
              >
                {answer}
              </motion.p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const FAQSection: React.FC = () => {
  const faqs = [
    {
      question: 'How does Meqenet work?',
      answer:
        'Meqenet allows you to buy items from our partner merchants and pay for them over time in interest-free installments. Simply choose Meqenet at checkout, get instant approval, and your payments will be split according to the plan you select.',
    },
    {
      question: 'Are there any interest charges or hidden fees?',
      answer:
        'No. Meqenet is a Sharia-compliant service. We never charge interest or any hidden fees. The total price you see at checkout is exactly what you will pay.',
    },
    {
      question: 'Who is eligible to use Meqenet?',
      answer:
        'To use Meqenet, you must be an Ethiopian resident, be at least 18 years old, and have a valid Ethiopian National ID (Fayda) or other accepted identification and a valid mobile number.',
    },
    {
      question: 'How do I make my payments?',
      answer:
        "You can easily make payments through our app using popular Ethiopian payment methods like Telebirr and CBE Birr. We will send you reminders before each payment is due so you don't miss it.",
    },
    {
      question: 'Which stores accept Meqenet?',
      answer:
        'We are partnered with a growing number of trusted merchants across Ethiopia, both online and in-store. You can browse our full list of partner stores directly in the Meqenet app.',
    },
    {
      question: 'What happens if I miss a payment?',
      answer:
        "We understand that things happen. While we don't charge penalties for late payments, it's important to pay on time to maintain a good standing and ensure you can continue using Meqenet for future purchases. Please contact our support team if you're facing difficulties.",
    },
  ];

  return (
    <section className="relative py-16 sm:py-20 md:py-24 lg:py-28 bg-gray-50 overflow-hidden">
      <div className="relative z-10 w-[calc(100%-20px)] sm:w-[calc(100%-40px)] md:w-[calc(100%-60px)] max-w-[1520px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column - FAQ Heading */}
          <div className="lg:col-span-4">
            <ScrollBlurItem>
              <h2 className="text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight">
                FAQ<span className="text-black">.</span>
              </h2>
            </ScrollBlurItem>
            <ScrollBlurItem>
              <div className="mt-6 text-sm sm:text-base text-gray-600 max-w-md">
                <p className="mb-1">
                  Got questions? We&apos;ve got answers. Here&apos;s
                </p>
                <p>everything you need to know about Meqenet.</p>
              </div>
            </ScrollBlurItem>
          </div>

          {/* Right Column - FAQ Items */}
          <div className="lg:col-span-8">
            <div className="space-y-[5px]">
              {faqs.map((faq, index) => (
                <ScrollBlurItem key={index}>
                  <FAQItem question={faq.question} answer={faq.answer} />
                </ScrollBlurItem>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
