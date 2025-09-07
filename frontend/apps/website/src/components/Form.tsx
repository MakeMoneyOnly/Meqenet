import React, { FormHTMLAttributes, forwardRef } from 'react';

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  onSubmit: () => void;
  children: React.ReactNode;
}

export const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ className, onSubmit, children, ...props }, ref) => {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit();
    };

    return (
      <form
        ref={ref}
        className={`space-y-6 ${className}`}
        onSubmit={handleSubmit}
        noValidate
        {...props}
      >
        {children}
      </form>
    );
  },
);

Form.displayName = 'Form';
