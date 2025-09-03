import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  onClick,
}) => {
  const baseStyles =
    'font-semibold rounded focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Security: Use a type-safe approach to prevent object injection attacks
  const getVariantStyles = (v: string): string => {
    switch (v) {
      case 'primary':
        return 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500';
      case 'secondary':
        return 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-500';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500';
      default:
        return 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500';
    }
  };

  const getSizeStyles = (s: string): string => {
    switch (s) {
      case 'small':
        return 'px-3 py-1 text-sm';
      case 'medium':
        return 'px-4 py-2 text-base';
      case 'large':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <button
      className={`${baseStyles} ${getVariantStyles(variant)} ${getSizeStyles(size)}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
