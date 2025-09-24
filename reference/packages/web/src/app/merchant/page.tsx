'use client';

import { useState } from 'react';
import Link from 'next/link';
import MerchantOnboarding from '@/components/MerchantOnboarding';

export default function MerchantPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would validate credentials with the API
    setIsLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">FlexPay Merchant Portal</h1>
          <Link href="/" className="text-primary-600 hover:text-primary-800">
            Back to Home
          </Link>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {!isLoggedIn ? (
              <>
                {!showRegister ? (
                  <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-8">
                      <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Merchant Login</h2>
                      <form onSubmit={handleLogin}>
                        <div className="mb-6">
                          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="mb-6">
                          <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                            Password
                          </label>
                          <input
                            type="password"
                            id="password"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            type="submit"
                            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                          >
                            Sign In
                          </button>
                        </div>
                      </form>
                      <div className="text-center mt-6">
                        <a href="#" className="text-sm text-primary-600 hover:text-primary-800">
                          Forgot Password?
                        </a>
                      </div>
                      <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                          Don&apos;t have an account?{' '}
                          <button
                            onClick={() => setShowRegister(true)}
                            className="text-primary-600 hover:text-primary-800 text-sm"
                          >
                            Register
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Merchant Registration</h2>
                      <button
                        onClick={() => setShowRegister(false)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        Back to Login
                      </button>
                    </div>
                    <MerchantOnboarding />
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Merchant Dashboard</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Welcome to your FlexPay merchant dashboard.</p>
                </div>
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Merchant ID</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">M12345</dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Business Name</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">Example Store</dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">API Key</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <code className="bg-gray-100 px-2 py-1 rounded">sk_test_1234567890abcdef</code>
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Total Transactions</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">42</dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Total Volume</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">ETB 125,000</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
