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

import { registerSchema, RegisterFormData } from '../lib/auth/schemas';
import { authApi } from '../lib/auth/auth-api';
import { useAuthStore } from '../../../../libs/state-management/src/lib/auth-store';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(data);
      login(response.user);
      // Redirect to dashboard or verification page
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register - Meqenet</title>
        <meta name="description" content="Create your Meqenet account" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                sign in to existing account
              </Link>
            </p>
          </div>

          <Form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            {error ? (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            ) : null}

            <div className="rounded-md shadow-sm space-y-4">
              <Input
                {...register('email')}
                type="email"
                label="Email address"
                autoComplete="email"
                error={errors.email?.message}
                disabled={isLoading}
              />

              <Input
                {...register('password')}
                type="password"
                label="Password"
                autoComplete="new-password"
                error={errors.password?.message}
                disabled={isLoading}
              />

              <Input
                {...register('phone')}
                type="tel"
                label="Phone number (optional)"
                autoComplete="tel"
                placeholder="+251XXXXXXXXX"
                error={errors.phone?.message}
                disabled={isLoading}
              />

              <Input
                {...register('faydaId')}
                type="text"
                label="Fayda National ID (optional)"
                autoComplete="off"
                placeholder="12-digit ID"
                error={errors.faydaId?.message}
                disabled={isLoading}
              />

              <Input
                {...register('firstName')}
                type="text"
                label="First name (optional)"
                autoComplete="given-name"
                error={errors.firstName?.message}
                disabled={isLoading}
              />

              <Input
                {...register('lastName')}
                type="text"
                label="Last name (optional)"
                autoComplete="family-name"
                error={errors.lastName?.message}
                disabled={isLoading}
              />
            </div>

            <div className="text-sm text-gray-600">
              <p>
                By creating an account, you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Privacy Policy
                </a>
              </p>
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
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </Form>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
