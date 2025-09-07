import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  // Helper functions to safely get class names
  const getSizeClasses = (size: 'sm' | 'md' | 'lg'): string => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-8 w-8';
      case 'md':
      default:
        return 'h-6 w-6';
    }
  };

  const getColorClasses = (
    color: 'primary' | 'secondary' | 'white',
  ): string => {
    switch (color) {
      case 'secondary':
        return 'text-gray-600';
      case 'white':
        return 'text-white';
      case 'primary':
      default:
        return 'text-blue-600';
    }
  };

  // Validate and get class names safely
  const validSize: 'sm' | 'md' | 'lg' =
    size && ['sm', 'md', 'lg'].includes(size) ? size : 'md';
  const validColor: 'primary' | 'secondary' | 'white' =
    color && ['primary', 'secondary', 'white'].includes(color)
      ? color
      : 'primary';

  return (
    <svg
      className={`animate-spin ${getSizeClasses(validSize)} ${getColorClasses(validColor)} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};
