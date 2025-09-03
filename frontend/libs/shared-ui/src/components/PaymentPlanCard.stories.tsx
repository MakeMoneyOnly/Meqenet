import type { Meta, StoryObj } from '@storybook/react';
import { PaymentPlanCard } from './PaymentPlanCard';

const meta: Meta<typeof PaymentPlanCard> = {
  component: PaymentPlanCard,
  title: 'Financial/PaymentPlanCard',
  argTypes: {
    onSelect: { action: 'selected' },
  },
};

export default meta;
type Story = StoryObj<typeof PaymentPlanCard>;

export const Default: Story = {
  args: {
    planName: 'Pay in 4',
    description: 'Split your purchase into 4 interest-free payments.',
    installments: 4,
    interestRate: '0%',
    features: ['No interest', 'No fees', 'No credit check'],
    isSelected: false,
    recommended: false,
  },
};

export const Selected: Story = {
  args: {
    ...Default.args,
    isSelected: true,
  },
};

export const Recommended: Story = {
  args: {
    ...Default.args,
    planName: 'Pay Over Time',
    description: 'Pay over a longer period of time with interest.',
    installments: 12,
    interestRate: '15%',
    features: ['Fixed monthly payments', 'No prepayment fees'],
    recommended: true,
  },
};

export const RecommendedSelected: Story = {
  args: {
    ...Recommended.args,
    isSelected: true,
  },
};
