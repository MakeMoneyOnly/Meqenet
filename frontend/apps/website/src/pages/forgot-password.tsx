import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Head from 'next/head';

import { Form } from '../components/Form';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Spinner } from '../components/Spinner';

import {
  passwordResetRequestSchema,
  PasswordResetRequestFormData,
} from '../lib/auth/schemas';
import { authApi } from '../lib/auth/auth-api';

const ForgotPasswordPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<PasswordResetRequestFormData>({
    resolver: zodResolver(passwordResetRequestSchema),
  });

  const onSubmit = async (data: PasswordResetRequestFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.requestPasswordReset(data);
      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to send password reset email. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Check Your Email - Meqenet</title>
          <meta name="description" content="Password reset email sent" />
        </Head>

        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
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
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Check your email
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                We&apos;ve sent a password reset link to{' '}
                <span className="font-medium">{getValues('email')}</span>
              </p>
              <p className="mt-4 text-center text-sm text-gray-500">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  try again
                </button>
              </p>
            </div>

            <div className="text-center">
              <Button
                onClick={() => router.push('/login')}
                variant="secondary"
                className="w-full"
              >
                Back to sign in
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Forgot Password - Meqenet</title>
        <meta name="description" content="Reset your Meqenet password" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
          </div>

          <Form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            {error ? (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            ) : null}

            <div className="rounded-md shadow-sm -space-y-px">
              <Input
                {...register('email')}
                type="email"
                label="Email address"
                autoComplete="email"
                error={errors.email?.message}
                disabled={isLoading}
                className="rounded-md"
              />

              {/* Hidden client ID field - in production this would be set by the app */}
              <input
                type="hidden"
                {...register('clientId')}
                value="meqenet-web"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" color="white" className="mr-2" />
                  Sending reset link...
                </>
              ) : (
                'Send reset link'
              )}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Back to sign in
              </Link>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
