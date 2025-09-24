'use client';

import { useState } from 'react';

interface FormData {
  businessName: string;
  businessType: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  tinNumber: string;
  tradeLicense: string;
  websiteUrl: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

export default function MerchantOnboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    businessType: '',
    contactPerson: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    tinNumber: '',
    tradeLicense: '',
    websiteUrl: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Merchant Onboarding</h2>

      {isSuccess ? (
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900">Application Submitted!</h3>
          <p className="mt-2 text-sm text-gray-500">
            Thank you for applying to become a FlexPay merchant. We will review your application and
            get back to you within 1-2 business days.
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => window.location.href = '/merchant'}
            >
              Go to Merchant Portal
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex-1 border-t-2 ${step >= 1 ? 'border-primary-500' : 'border-gray-200'}`}></div>
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  step >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
                } mx-2`}
              >
                1
              </div>
              <div className={`flex-1 border-t-2 ${step >= 2 ? 'border-primary-500' : 'border-gray-200'}`}></div>
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  step >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
                } mx-2`}
              >
                2
              </div>
              <div className={`flex-1 border-t-2 ${step >= 3 ? 'border-primary-500' : 'border-gray-200'}`}></div>
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  step >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
                } mx-2`}
              >
                3
              </div>
              <div className={`flex-1 border-t-2 ${step >= 3 ? 'border-primary-500' : 'border-gray-200'}`}></div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">Business Information</span>
              <span className="text-xs text-gray-500">Contact Details</span>
              <span className="text-xs text-gray-500">Banking Information</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.businessType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Business Type</option>
                    <option value="RETAIL">Retail</option>
                    <option value="ECOMMERCE">E-Commerce</option>
                    <option value="RESTAURANT">Restaurant</option>
                    <option value="TRAVEL">Travel</option>
                    <option value="EDUCATION">Education</option>
                    <option value="HEALTHCARE">Healthcare</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="tinNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    TIN Number
                  </label>
                  <input
                    type="text"
                    id="tinNumber"
                    name="tinNumber"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.tinNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="tradeLicense" className="block text-sm font-medium text-gray-700 mb-1">
                    Trade License Number
                  </label>
                  <input
                    type="text"
                    id="tradeLicense"
                    name="tradeLicense"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.tradeLicense}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    id="websiteUrl"
                    name="websiteUrl"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={handleNext}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={handlePrevious}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={handleNext}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    id="bankName"
                    name="bankName"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.bankName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    id="bankAccountNumber"
                    name="bankAccountNumber"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.bankAccountNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="bankAccountName" className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account Name
                  </label>
                  <input
                    type="text"
                    id="bankAccountName"
                    name="bankAccountName"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.bankAccountName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={handlePrevious}
                  >
                    Previous
                  </button>
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </>
      )}
    </div>
  );
}
