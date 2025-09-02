import type { Meta, StoryObj } from '@storybook/react';
import { PaymentPlanCard } from './PaymentPlanCard';
import { useState } from 'react';

const meta: Meta<typeof PaymentPlanCard> = {
  title: 'Financial/PaymentPlanCard',
  component: PaymentPlanCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onSelect: { action: 'plan selected' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PayInFull: Story = {
  args: {
    planName: 'Pay in Full',
    description: 'Pay the entire amount now with no additional fees',
    installments: 1,
    interestRate: '0%',
    isSelected: false,
    onSelect: () => console.log('Pay in Full selected'),
  },
};

export const PayIn3: Story = {
  args: {
    planName: 'Pay in 3',
    description: 'Split your payment into 3 equal monthly installments',
    installments: 3,
    interestRate: '0%',
    isSelected: false,
    onSelect: () => console.log('Pay in 3 selected'),
  },
};

export const PayIn6: Story = {
  args: {
    planName: 'Pay in 6',
    description: 'Split your payment into 6 monthly installments with low interest',
    installments: 6,
    interestRate: '5%',
    isSelected: false,
    onSelect: () => console.log('Pay in 6 selected'),
  },
};

export const PayOverTime: Story = {
  args: {
    planName: 'Pay Over Time',
    description: 'Flexible payment terms up to 12 months with competitive rates',
    installments: 12,
    interestRate: '12%',
    isSelected: false,
    onSelect: () => console.log('Pay Over Time selected'),
  },
};

export const Selected: Story = {
  args: {
    planName: 'Pay in 3',
    description: 'Split your payment into 3 equal monthly installments',
    installments: 3,
    interestRate: '0%',
    isSelected: true,
    onSelect: () => console.log('Plan selected'),
  },
};

// Interactive story showing multiple cards
export const MultipleOptions: Story = {
  render: () => {
    const [selectedPlan, setSelectedPlan] = useState<string>('pay-in-3');
    
    const plans = [
      {
        id: 'pay-in-full',
        planName: 'Pay in Full',
        description: 'Pay the entire amount now with no additional fees',
        installments: 1,
        interestRate: '0%',
      },
      {
        id: 'pay-in-3',
        planName: 'Pay in 3',
        description: 'Split your payment into 3 equal monthly installments',
        installments: 3,
        interestRate: '0%',
      },
      {
        id: 'pay-in-6',
        planName: 'Pay in 6',
        description: 'Split your payment into 6 monthly installments with low interest',
        installments: 6,
        interestRate: '5%',
      },
      {
        id: 'pay-over-time',
        planName: 'Pay Over Time',
        description: 'Flexible payment terms up to 12 months',
        installments: 12,
        interestRate: '12%',
      },
    ];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {plans.map((plan) => (
          <PaymentPlanCard
            key={plan.id}
            {...plan}
            isSelected={selectedPlan === plan.id}
            onSelect={() => setSelectedPlan(plan.id)}
          />
        ))}
      </div>
    );
  },
};

export const LongDescription: Story = {
  args: {
    planName: 'Premium Financing',
    description: 'This is a special financing option designed for high-value purchases. Get extended payment terms with competitive interest rates and flexible repayment schedules tailored to your financial situation.',
    installments: 24,
    interestRate: '8.5%',
    isSelected: false,
    onSelect: () => console.log('Premium Financing selected'),
  },
};