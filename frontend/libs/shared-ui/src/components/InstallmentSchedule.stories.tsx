import type { Meta, StoryObj } from '@storybook/react';
import { InstallmentSchedule, Installment } from './InstallmentSchedule';

const meta: Meta<typeof InstallmentSchedule> = {
  title: 'Financial/InstallmentSchedule',
  component: InstallmentSchedule,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onPayInstallment: { action: 'pay installment clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockInstallments: Installment[] = [
  {
    id: 'inst-001',
    installmentNumber: 1,
    dueDate: '2024-01-15',
    amount: 1120,
    principalAmount: 1000,
    interestAmount: 120,
    status: 'paid',
    paidDate: '2024-01-14',
    paidAmount: 1120,
  },
  {
    id: 'inst-002',
    installmentNumber: 2,
    dueDate: '2024-02-15',
    amount: 1120,
    principalAmount: 1000,
    interestAmount: 120,
    status: 'paid',
    paidDate: '2024-02-13',
    paidAmount: 1120,
  },
  {
    id: 'inst-003',
    installmentNumber: 3,
    dueDate: '2024-03-15',
    amount: 1120,
    principalAmount: 1000,
    interestAmount: 120,
    status: 'pending',
  },
  {
    id: 'inst-004',
    installmentNumber: 4,
    dueDate: '2024-04-15',
    amount: 1120,
    principalAmount: 1000,
    interestAmount: 120,
    status: 'upcoming',
  },
  {
    id: 'inst-005',
    installmentNumber: 5,
    dueDate: '2024-05-15',
    amount: 1120,
    principalAmount: 1000,
    interestAmount: 120,
    status: 'upcoming',
  },
];

const overdueInstallments: Installment[] = [
  {
    id: 'inst-001',
    installmentNumber: 1,
    dueDate: '2024-01-15',
    amount: 550,
    principalAmount: 500,
    interestAmount: 50,
    status: 'paid',
    paidDate: '2024-01-14',
    paidAmount: 550,
  },
  {
    id: 'inst-002',
    installmentNumber: 2,
    dueDate: '2024-02-15',
    amount: 550,
    principalAmount: 500,
    interestAmount: 50,
    status: 'overdue',
  },
  {
    id: 'inst-003',
    installmentNumber: 3,
    dueDate: '2024-03-15',
    amount: 550,
    principalAmount: 500,
    interestAmount: 50,
    status: 'pending',
  },
];

export const Default: Story = {
  args: {
    installments: mockInstallments,
    currency: 'ETB',
    showPayButton: true,
    onPayInstallment: (id) => console.log('Pay installment:', id),
  },
};

export const WithOverdue: Story = {
  args: {
    installments: overdueInstallments,
    currency: 'ETB',
    showPayButton: true,
    onPayInstallment: (id) => console.log('Pay installment:', id),
  },
};

export const NoPayButton: Story = {
  args: {
    installments: mockInstallments,
    currency: 'ETB',
    showPayButton: false,
  },
};

export const USDCurrency: Story = {
  args: {
    installments: mockInstallments.map(inst => ({
      ...inst,
      amount: inst.amount / 50, // Convert to USD for example
      principalAmount: inst.principalAmount / 50,
      interestAmount: inst.interestAmount / 50,
    })),
    currency: 'USD',
    showPayButton: true,
    onPayInstallment: (id) => console.log('Pay installment:', id),
  },
};

export const AllPaid: Story = {
  args: {
    installments: mockInstallments.map(inst => ({
      ...inst,
      status: 'paid' as const,
      paidDate: inst.dueDate,
      paidAmount: inst.amount,
    })),
    currency: 'ETB',
    showPayButton: false,
  },
};

export const LongSchedule: Story = {
  args: {
    installments: Array.from({ length: 12 }, (_, i) => ({
      id: `inst-${i + 1}`,
      installmentNumber: i + 1,
      dueDate: new Date(2024, i, 15).toISOString(),
      amount: 1000,
      principalAmount: 900,
      interestAmount: 100,
      status: i < 2 ? 'paid' as const : i === 2 ? 'pending' as const : 'upcoming' as const,
      ...(i < 2 ? {
        paidDate: new Date(2024, i, 14).toISOString(),
        paidAmount: 1000,
      } : {}),
    })),
    currency: 'ETB',
    showPayButton: true,
    onPayInstallment: (id) => console.log('Pay installment:', id),
  },
};