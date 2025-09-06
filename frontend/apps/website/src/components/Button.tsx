import React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'primary',
      isLoading = false,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variantStyles = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary:
        'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
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

    return (
      <button
        className={`${baseStyles} ${getVariantStyle(variant)} ${className}`}
        ref={ref}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
