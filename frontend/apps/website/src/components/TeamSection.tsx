import React from 'react';
import Image from 'next/image';
import ScrollBlurItem from './common/ui/ScrollBlurItem';

const TeamMemberCard: React.FC<{
  imgSrc: string;
  name: string;
  role: string;
  company: string;
}> = ({ imgSrc, name, role, company }) => {
  return (
    <ScrollBlurItem>
      <div className="relative rounded-2xl overflow-hidden h-64 sm:h-80 md:h-96 group">
        <Image
          src={imgSrc}
          alt={name}
          fill
          style={{ objectFit: 'cover' }}
          className="transform group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="absolute top-4 left-4">
          <button className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white">
            +
          </button>
        </div>
        <div className="absolute top-4 right-4 text-right text-white text-xs">
          <p className="font-bold">{role}</p>
          <p>at {company}</p>
        </div>
        <div className="absolute bottom-4 left-4 text-white">
          <p className="font-bold text-lg">{name}</p>
        </div>
      </div>
    </ScrollBlurItem>
  );
};

const TeamSection: React.FC = () => {
  const teamMembers = [
    {
      imgSrc:
        'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=800&q=60',
      name: 'Abebe Bikila',
      role: 'CEO & Founder',
      company: 'meqenet®',
    },
    {
      imgSrc:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=60',
      name: 'Tigist Assefa',
      role: 'Head of Product',
      company: 'meqenet®',
    },
    {
      imgSrc:
        'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=800&q=60',
      name: 'Dawit Lemma',
      role: 'Lead Engineer',
      company: 'meqenet®',
    },
    {
      imgSrc:
        'https://images.unsplash.com/photo-1600878459145-4603b3a4a639?auto=format&fit=crop&w=800&q=60',
      name: 'Selamawit Gebru',
      role: 'Merchant Partnerships',
      company: 'meqenet®',
    },
  ];

  return (
    <section className="relative py-8 sm:py-12 md:py-16 lg:py-20 bg-gray-50 overflow-hidden">
      <div className="relative z-10 w-[calc(100%-20px)] sm:w-[calc(100%-40px)] md:w-[calc(100%-60px)] max-w-[1520px] mx-auto">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-8 sm:p-12 md:p-16 lg:p-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left Column */}
            <div className="flex flex-col justify-between">
              <div>
                <ScrollBlurItem>
                  <p className="text-sm font-bold mb-6">meqenet®</p>
                </ScrollBlurItem>
                <ScrollBlurItem>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-tight">
                    <span className="text-black">Meet the team driving</span>{' '}
                    <span className="text-gray-400">financial inclusion.</span>
                  </h2>
                </ScrollBlurItem>
                <div className="flex space-x-24 mt-12">
                  <ScrollBlurItem>
                    <span className="text-gray-300 text-2xl">+</span>
                  </ScrollBlurItem>
                  <ScrollBlurItem>
                    <span className="text-gray-300 text-2xl">+</span>
                  </ScrollBlurItem>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mt-12">
                <ScrollBlurItem>
                  <div>
                    <h3 className="text-lg font-bold mb-2">Join Our Mission</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      We&apos;re building a team dedicated to empowering
                      Ethiopian consumers and merchants.
                    </p>
                    <button className="bg-black text-white text-sm font-bold py-2 px-4 rounded-full flex items-center space-x-2">
                      <span>See Open Roles</span>
                      <span className="w-2 h-2 bg-white rounded-full" />
                    </button>
                  </div>
                </ScrollBlurItem>
                <ScrollBlurItem>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    We believe great work comes{' '}
                    <span className="text-black font-bold">
                      from collaboration and a shared vision.
                    </span>{' '}
                    Our goal is to build intuitive financial tools that make a
                    real difference.
                  </p>
                </ScrollBlurItem>
              </div>
            </div>

            {/* Right Column - Card Grid with exact 5px spacing and thinner cards */}
            <div className="relative px-10 lg:px-25">
              <div className="grid grid-cols-2" style={{ gap: '5px' }}>
                {teamMembers.map((member, index) => (
                  <div key={index} className="w-full">
                    <TeamMemberCard {...member} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
