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

  const variantStyles = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-500',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
  };

  const sizeStyles = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  // Safe property access to avoid object injection vulnerabilities
  const getVariantStyle = (v: typeof variant): string => {
    switch (v) {
      case 'primary':
        return variantStyles.primary;
      case 'secondary':
        return variantStyles.secondary;
      case 'danger':
        return variantStyles.danger;
      default:
        return variantStyles.primary;
    }
  };

  const getSizeStyle = (s: typeof size): string => {
    switch (s) {
      case 'small':
        return sizeStyles.small;
      case 'medium':
        return sizeStyles.medium;
      case 'large':
        return sizeStyles.large;
      default:
        return sizeStyles.medium;
    }
  };

  return (
    <button
      className={`${baseStyles} ${getVariantStyle(variant)} ${getSizeStyle(size)}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
