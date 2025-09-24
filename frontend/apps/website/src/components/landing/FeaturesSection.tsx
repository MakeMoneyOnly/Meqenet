import React from 'react';
import { UserCheck, HandCoins, ShoppingCart, Lock, FileText, Repeat } from 'lucide-react';

// Service card component
const ServiceCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}> = ({ icon, title, description, className = "" }) => (
  <div className={`bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${className}`}>
    <div className="text-blue-500 mb-5">{icon}</div>
    <h3 className="text-xl font-bold text-gray-800 mb-3 font-aeonik">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed font-aeonik">{description}</p>
  </div>
);

const ServicesSection: React.FC = () => {
  return (
    <section data-scroll-section className="w-full py-20 px-4 sm:px-8 md:px-16 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 font-aeonik text-gray-800">
            A New Way to Pay
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-center font-aeonik text-base leading-relaxed">
            In today&apos;s fast-paced world, your financial flexibility deserves the utmost attention.
            That&apos;s why Meqenet offers a suite of integrated services designed to make Buy Now, Pay Later simple, fair, and accessible for all Ethiopians.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ServiceCard 
            icon={<UserCheck size={32} />}
            title="Seamless Onboarding"
            description="Get started in minutes. Our streamlined and secure KYC process uses your Ethiopian ID for instant approval."
          />
          <ServiceCard 
            icon={<HandCoins size={32} />}
            title="Flexible Payment Plans"
            description="Shop now and pay later with our 100% interest-free installment plans. Choose a schedule that works for your budget."
          />
          <ServiceCard 
            icon={<ShoppingCart size={32} />}
            title="Shop In-App"
            description="Browse products from trusted Ethiopian merchants and check out securely, all within the Meqenet app."
          />
          <ServiceCard 
            icon={<Lock size={32} />}
            title="Bank-Level Security"
            description="Your financial data is protected with end-to-end encryption and the highest security standards."
          />
          <ServiceCard 
            icon={<FileText size={32} />}
            title="Digital Documentation"
            description="Access all your transaction histories and payment schedules instantly for clear record-keeping."
          />
          <ServiceCard 
            icon={<Repeat size={32} />}
            title="Automated Payments"
            description="Set up automatic installment payments via Telebirr or CBE Birr to save time and avoid late fees."
          />
        </div>
      </div>
    </section>
  );
};

export default ServicesSection; 