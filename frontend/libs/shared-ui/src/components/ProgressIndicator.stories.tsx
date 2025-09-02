import type { Meta, StoryObj } from '@storybook/react';
import { ProgressIndicator } from './ProgressIndicator';

const meta: Meta<typeof ProgressIndicator> = {
  title: 'Financial/ProgressIndicator',
  component: ProgressIndicator,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    currentStep: {
      control: { type: 'range', min: 0, max: 5, step: 1 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LoanApplication: Story = {
  args: {
    currentStep: 2,
    totalSteps: 5,
    steps: [
      'Personal Info',
      'KYC Verification',
      'Loan Details',
      'Review',
      'Confirmation',
    ],
  },
};

export const PaymentProcess: Story = {
  args: {
    currentStep: 1,
    totalSteps: 4,
    steps: [
      'Select Plan',
      'Payment Method',
      'Review Order',
      'Complete',
    ],
  },
};

export const OnboardingFlow: Story = {
  args: {
    currentStep: 3,
    totalSteps: 6,
    steps: [
      'Welcome',
      'Account Setup',
      'Identity Verification',
      'Phone Verification',
      'Set PIN',
      'Ready to Go',
    ],
  },
};

export const SimpleThreeStep: Story = {
  args: {
    currentStep: 1,
    totalSteps: 3,
    steps: [
      'Step 1',
      'Step 2',
      'Step 3',
    ],
  },
};

export const AllCompleted: Story = {
  args: {
    currentStep: 5,
    totalSteps: 5,
    steps: [
      'Personal Info',
      'KYC Verification',
      'Loan Details',
      'Review',
      'Confirmation',
    ],
  },
};

export const NotStarted: Story = {
  args: {
    currentStep: 0,
    totalSteps: 4,
    steps: [
      'Start',
      'Process',
      'Review',
      'Complete',
    ],
  },
};

export const MerchantOnboarding: Story = {
  args: {
    currentStep: 2,
    totalSteps: 7,
    steps: [
      'Business Info',
      'Documents',
      'Bank Details',
      'Integration',
      'Test Transaction',
      'Review',
      'Approval',
    ],
  },
};

export const CreditApplication: Story = {
  args: {
    currentStep: 4,
    totalSteps: 8,
    steps: [
      'Eligibility Check',
      'Personal Details',
      'Employment Info',
      'Financial Info',
      'Document Upload',
      'Credit Check',
      'Offer Review',
      'Accept Terms',
    ],
  },
};