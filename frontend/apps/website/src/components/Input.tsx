import React from 'react';

// Constants for input component - FinTech compliance
const RANDOM_ID_LENGTH = 9;
const RANDOM_ID_RADIX = 36;
const RANDOM_ID_START_INDEX = 2;

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    // Generate unique ID without using hooks (safe for forwardRef)
    const inputId =
      id ||
      `input-${Math.random()
        .toString(RANDOM_ID_RADIX)
        .substring(
          RANDOM_ID_START_INDEX,
          RANDOM_ID_START_INDEX + RANDOM_ID_LENGTH,
        )}`;
    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        <input
          type={type}
          id={inputId}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${className}`}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error ? (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
