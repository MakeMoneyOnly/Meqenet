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

import { loginSchema, LoginFormData } from '../lib/auth/schemas';
import { authApi, decodeJwtToken } from '../lib/auth/auth-api';
import { useAuthStore } from '../../../../libs/state-management/src/lib/auth-store';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(data);

      // Decode JWT token to get user information
      const decodedToken = decodeJwtToken(response.accessToken);
      if (!decodedToken) {
        throw new Error('Failed to decode authentication token');
      }

      // Create user object from decoded token
      // Note: Role information is not included in JWT for security.
      // In production, consider fetching user details from a separate endpoint
      const user = {
        id: decodedToken.sub,
        name: decodedToken.email, // Using email as name until we have display name
        email: decodedToken.email,
        roles: ['CUSTOMER'], // Default role, should be fetched from backend
      };

      login(user);
      // Redirect to dashboard or home
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Meqenet</title>
        <meta name="description" content="Login to your Meqenet account" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                create a new account
              </Link>
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
                className="rounded-t-md"
                disabled={isLoading}
              />

              <Input
                {...register('password')}
                type="password"
                label="Password"
                autoComplete="current-password"
                error={errors.password?.message}
                className="rounded-b-md"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>
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
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </Form>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
