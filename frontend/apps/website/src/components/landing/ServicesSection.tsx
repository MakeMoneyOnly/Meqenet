import React from 'react';

// Service card icons
const OnlineConsultationIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M26.6667 2.66667H5.33333C3.86667 2.66667 2.66667 3.86667 2.66667 5.33333V21.3333C2.66667 22.8 3.86667 24 5.33333 24H9.33333L13.3333 28V24H26.6667C28.1333 24 29.3333 22.8 29.3333 21.3333V5.33333C29.3333 3.86667 28.1333 2.66667 26.6667 2.66667Z"
      fill="#00A4F4"
    />
  </svg>
);

const BookingAppointmentIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M25.3333 5.33333H24V2.66667H21.3333V5.33333H10.6667V2.66667H8V5.33333H6.66667C5.2 5.33333 4 6.53333 4 8V26.6667C4 28.1333 5.2 29.3333 6.66667 29.3333H25.3333C26.8 29.3333 28 28.1333 28 26.6667V8C28 6.53333 26.8 5.33333 25.3333 5.33333ZM25.3333 26.6667H6.66667V13.3333H25.3333V26.6667ZM25.3333 10.6667H6.66667V8H25.3333V10.6667Z"
      fill="#00A4F4"
    />
  </svg>
);

const PrescriptionIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18.6667 2.66667H8C6.53333 2.66667 5.33333 3.86667 5.33333 5.33333V26.6667C5.33333 28.1333 6.53333 29.3333 8 29.3333H24C25.4667 29.3333 26.6667 28.1333 26.6667 26.6667V10.6667L18.6667 2.66667ZM24 26.6667H8V5.33333H17.3333V12H24V26.6667Z"
      fill="#00A4F4"
    />
    <path d="M12 17.3333H20V20H12V17.3333Z" fill="#00A4F4" />
    <path d="M12 21.3333H20V24H12V21.3333Z" fill="#00A4F4" />
  </svg>
);

const MedicalNotesIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18.6667 2.66667H8C6.53333 2.66667 5.33333 3.86667 5.33333 5.33333V26.6667C5.33333 28.1333 6.53333 29.3333 8 29.3333H24C25.4667 29.3333 26.6667 28.1333 26.6667 26.6667V10.6667L18.6667 2.66667ZM21.3333 24H10.6667V21.3333H21.3333V24ZM21.3333 18.6667H10.6667V16H21.3333V18.6667ZM17.3333 12V4.66667L24.6667 12H17.3333Z"
      fill="#00A4F4"
    />
  </svg>
);

const MedicineRefillsIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M25.3333 4H19.76C19.2 2.45333 17.7333 1.33333 16 1.33333C14.2667 1.33333 12.8 2.45333 12.24 4H6.66667C5.2 4 4 5.2 4 6.66667V25.3333C4 26.8 5.2 28 6.66667 28H25.3333C26.8 28 28 26.8 28 25.3333V6.66667C28 5.2 26.8 4 25.3333 4ZM16 4C16.7333 4 17.3333 4.6 17.3333 5.33333C17.3333 6.06667 16.7333 6.66667 16 6.66667C15.2667 6.66667 14.6667 6.06667 14.6667 5.33333C14.6667 4.6 15.2667 4 16 4ZM21.3333 20H17.3333V24H14.6667V20H10.6667V17.3333H14.6667V13.3333H17.3333V17.3333H21.3333V20Z"
      fill="#00A4F4"
    />
  </svg>
);

// Service card component
const ServiceCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}> = ({ icon, title, description, className = '' }) => (
  <div
    className={`bg-white rounded-[16px] p-6 border border-[#E5F6FF] shadow-sm hover:shadow-md transition-shadow ${className}`}
  >
    <div className="text-healnet-500 mb-5">{icon}</div>
    <h3 className="text-xl font-bold text-gray-800 mb-3 font-aeonik">
      {title}
    </h3>
    <p className="text-gray-600 text-sm leading-relaxed font-aeonik">
      {description}
    </p>
  </div>
);

const ServicesSection: React.FC = () => {
  return (
    <section data-scroll-section className="w-full py-20 px-[100px]">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 font-aeonik">
            <span className="text-[#3D3D3D]">Top </span>
            <span className="bg-gradient-to-r from-healnet-500 to-healnet-300 inline-block text-transparent bg-clip-text">
              services
            </span>
            <span className="text-[#3D3D3D]"> we offer</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-center font-aeonik text-base leading-relaxed">
            In today&apos;s fast-paced world, your financial flexibility
            deserves the utmost attention and convenience. That&apos;s why
            Meqenet offers a suite of integrated services designed to make Buy
            Now Pay Later simple:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <ServiceCard
            icon={<OnlineConsultationIcon />}
            title="Quick Online Application"
            description="Apply with top merchants across various categories via our secure, private, and convenient platform. Choose the best products you want and proceed with our easy-to-use financing options."
          />
          <ServiceCard
            icon={<BookingAppointmentIcon />}
            title="Flexible Payment Plans"
            description="Choose the best payment schedule for your budget with our easy-to-use system. Select from various installment options or proceed with our recommended payment plans."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ServiceCard
            icon={<PrescriptionIcon />}
            title="Instant Approvals"
            description="Receive quick financing approval digitally after your application with our advanced system."
          />
          <ServiceCard
            icon={<MedicalNotesIcon />}
            title="Digital Documentation"
            description="Obtain necessary financial documents for your records with only a few clicks of hassle."
          />
          <ServiceCard
            icon={<MedicineRefillsIcon />}
            title="Automated Payments"
            description="Skip the payment reminder hassle and save time + energy by setting up automatic installment payments."
          />
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
