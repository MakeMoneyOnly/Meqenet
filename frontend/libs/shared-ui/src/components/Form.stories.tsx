import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Form } from './Form';
import { Input } from './Input';
import { Button } from './Button';

const meta: Meta<typeof Form> = {
  title: 'Components/Form',
  component: Form,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A form component with built-in submit handling and validation support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' },
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Input label="Email" type="email" placeholder="Enter your email" />
        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
        />
        <Button type="submit" variant="primary">
          Submit
        </Button>
      </>
    ),
  },
};

export const WithValidation: Story = {
  args: {
    children: (
      <>
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          error="Please enter a valid email address"
        />
        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          error="Password must be at least 8 characters"
        />
        <Button type="submit" variant="primary" isLoading>
          Submitting...
        </Button>
      </>
    ),
  },
};
