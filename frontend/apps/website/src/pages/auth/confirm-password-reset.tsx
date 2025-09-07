import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Head from 'next/head';

import { Form } from '../../components/Form';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Spinner } from '../../components/Spinner';

import {
  passwordResetConfirmSchema,
  PasswordResetConfirmFormData,
} from '../../lib/auth/schemas';
import { authApi } from '../../lib/auth/auth-api';

const ConfirmPasswordResetPage: React.FC = () => {
  const router = useRouter();
  const { token } = router.query;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PasswordResetConfirmFormData>({
    resolver: zodResolver(passwordResetConfirmSchema),
  });

  useEffect(() => {
    if (token) {
      setValue('token', token as string);
    }
  }, [token, setValue]);

  const onSubmit = async (data: PasswordResetConfirmFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.confirmPasswordReset(data);
      router.push('/login?reset=success');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to reset password. The link may have expired.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Confirm Password Reset - Meqenet</title>
        <meta name="description" content="Confirm your new password" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Set a new password
            </h2>
          </div>

          <Form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            {error ? (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            ) : null}

            <input type="hidden" {...register('token')} />

            <div className="rounded-md shadow-sm -space-y-px">
              <Input
                {...register('newPassword')}
                type="password"
                label="New password"
                autoComplete="new-password"
                error={errors.newPassword?.message}
                className="rounded-t-md"
                disabled={isLoading}
              />

              <Input
                {...register('confirmPassword')}
                type="password"
                label="Confirm new password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                className="rounded-b-md"
                disabled={isLoading}
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
                  Resetting password...
                </>
              ) : (
                'Set new password'
              )}
            </Button>
          </Form>
        </div>
      </div>
    </>
  );
};

export default ConfirmPasswordResetPage;
