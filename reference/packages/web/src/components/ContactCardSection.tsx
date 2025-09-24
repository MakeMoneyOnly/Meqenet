import React from 'react';
import Image from 'next/image';

const ContactCardSection: React.FC = () => {
  return (
    <section className="w-full flex justify-center items-center py-20 bg-transparent">
      <div className="w-full max-w-7xl bg-black rounded-3xl flex flex-col lg:flex-row overflow-hidden shadow-2xl">
        {/* Left: Form */}
        <div className="w-full lg:w-1/2 bg-white p-10 flex flex-col justify-between min-h-[600px]">
          <div>
            <div className="text-lg font-bold mb-2">meqenet®</div>
            <h2 className="text-3xl font-bold mb-6 text-black">Interested in becoming a partner<span className="text-gray-400">?</span></h2>
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-black">Your name*</label>
                <input type="text" placeholder="John Doe" className="w-full rounded-xl bg-gray-100 px-4 py-3 text-base outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-black">E-mail*</label>
                <input type="email" placeholder="hello@site.com" className="w-full rounded-xl bg-gray-100 px-4 py-3 text-base outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-black">Message</label>
                <textarea placeholder="Your message" className="w-full rounded-xl bg-gray-100 px-4 py-3 text-base outline-none min-h-[80px]" />
              </div>
              <button type="submit" className="w-full bg-black text-white rounded-full py-3 text-lg font-semibold mt-2 transition hover:bg-gray-900">Send Message</button>
            </form>
          </div>
          <div className="mt-6 text-xs text-gray-500">
            By submitting, you agree to our <span className="underline cursor-pointer">Terms</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
          </div>
        </div>
        {/* Right: Info */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-10 text-white relative min-h-[600px]">
          <h1 className="text-6xl md:text-7xl font-bold mb-6">Let&apos;s grow<span className="text-white">.</span></h1>
          <div className="text-2xl font-semibold mb-6 text-left w-full max-w-xl">Tell us about your business and how we can help you reach more customers.</div>
          <div className="w-full max-w-xl border-t border-white/20 my-8" />
          <div className="flex flex-col md:flex-row w-full max-w-xl gap-10 mb-10">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span className="font-bold">Quick Onboarding.</span>
              </div>
              <div className="text-sm text-gray-300">Our team will get you set up to accept Meqenet payments in no time.</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 17v-2a4 4 0 0 1 4-4h4"/><path d="M17 9l4 4-4 4"/></svg>
                <span className="font-bold">Dedicated Support.</span>
              </div>
              <div className="text-sm text-gray-300">We provide a dedicated merchant success manager to help you grow.</div>
            </div>
          </div>
          {/* Team Lead Card */}
          <div className="absolute bottom-8 right-8 bg-white rounded-2xl flex items-center shadow-lg p-4 min-w-[320px]">
            <Image src="https://images.unsplash.com/photo-1600878459145-4603b3a4a639?auto=format&fit=crop&w=800&q=60" alt="Selamawit Gebru" width={64} height={64} className="w-16 h-16 rounded-xl object-cover mr-4" />
            <div>
              <div className="text-xs text-gray-500 font-semibold">Merchant Partnerships</div>
              <div className="text-xs text-gray-400 mb-1">at meqenet®</div>
              <div className="text-lg font-bold text-black">Selamawit Gebru</div>
              <button className="mt-2 bg-black text-white rounded-full px-4 py-1 text-xs font-semibold flex items-center gap-2">Ask directly <span className="inline-block w-2 h-2 bg-white rounded-full" /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactCardSection; 