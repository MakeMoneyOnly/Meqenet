import type { Meta, StoryObj } from '@storybook/react';
import { LoanSummaryCard, LoanDetails } from './LoanSummaryCard';

const meta: Meta<typeof LoanSummaryCard> = {
  title: 'Financial/LoanSummaryCard',
  component: LoanSummaryCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onViewDetails: { action: 'view details clicked' },
    onMakePayment: { action: 'make payment clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const activeLoan: LoanDetails = {
  loanId: 'LN-2024-001',
  principalAmount: 10000,
  totalAmount: 11200,
  paidAmount: 3360,
  remainingAmount: 7840,
  nextPaymentDate: '2024-02-15',
  nextPaymentAmount: 1120,
  installmentsPaid: 3,
  totalInstallments: 10,
  status: 'active',
  currency: 'ETB',
};

const overdueLoan: LoanDetails = {
  loanId: 'LN-2024-002',
  principalAmount: 5000,
  totalAmount: 5500,
  paidAmount: 1100,
  remainingAmount: 4400,
  nextPaymentDate: '2024-01-10',
  nextPaymentAmount: 550,
  installmentsPaid: 2,
  totalInstallments: 10,
  status: 'overdue',
  currency: 'ETB',
};

const completedLoan: LoanDetails = {
  loanId: 'LN-2023-015',
  principalAmount: 15000,
  totalAmount: 16500,
  paidAmount: 16500,
  remainingAmount: 0,
  nextPaymentDate: '2023-12-15',
  nextPaymentAmount: 0,
  installmentsPaid: 12,
  totalInstallments: 12,
  status: 'completed',
  currency: 'ETB',
};

export const Active: Story = {
  args: {
    loan: activeLoan,
    onViewDetails: () => console.log('View details'),
    onMakePayment: () => console.log('Make payment'),
  },
};

export const Overdue: Story = {
  args: {
    loan: overdueLoan,
    onViewDetails: () => console.log('View details'),
    onMakePayment: () => console.log('Make payment'),
  },
};

export const Completed: Story = {
  args: {
    loan: completedLoan,
    onViewDetails: () => console.log('View details'),
    onMakePayment: () => console.log('Make payment'),
  },
};

export const NoActions: Story = {
  args: {
    loan: activeLoan,
  },
};

export const CustomCurrency: Story = {
  args: {
    loan: {
      ...activeLoan,
      currency: 'USD',
    },
    onViewDetails: () => console.log('View details'),
    onMakePayment: () => console.log('Make payment'),
  },
};