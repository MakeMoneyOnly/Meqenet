import type { Meta, StoryObj } from '@storybook/react';
import { CreditScoreIndicator } from './CreditScoreIndicator';

const meta: Meta<typeof CreditScoreIndicator> = {
  title: 'Financial/CreditScoreIndicator',
  component: CreditScoreIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    score: {
      control: { type: 'range', min: 300, max: 850, step: 10 },
    },
    maxScore: {
      control: { type: 'number' },
    },
    showDetails: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Excellent: Story = {
  args: {
    score: 780,
    maxScore: 850,
    showDetails: true,
    lastUpdated: '2024-01-15',
    nextUpdate: '2024-02-15',
    factors: {
      positive: [
        'Consistent on-time payments',
        'Low credit utilization (15%)',
        'Long credit history (5+ years)',
      ],
      negative: [],
    },
  },
};

export const Good: Story = {
  args: {
    score: 720,
    maxScore: 850,
    showDetails: true,
    lastUpdated: '2024-01-10',
    nextUpdate: '2024-02-10',
    factors: {
      positive: [
        'Regular payment history',
        'Multiple credit accounts',
      ],
      negative: [
        'High credit utilization (45%)',
      ],
    },
  },
};

export const Fair: Story = {
  args: {
    score: 650,
    maxScore: 850,
    showDetails: true,
    lastUpdated: '2024-01-05',
    nextUpdate: '2024-02-05',
    factors: {
      positive: [
        'No recent defaults',
      ],
      negative: [
        'Some late payments in history',
        'High debt-to-income ratio',
        'Limited credit history',
      ],
    },
  },
};

export const Poor: Story = {
  args: {
    score: 580,
    maxScore: 850,
    showDetails: true,
    lastUpdated: '2024-01-01',
    nextUpdate: '2024-02-01',
    factors: {
      positive: [],
      negative: [
        'Multiple late payments',
        'Very high credit utilization (85%)',
        'Recent default on loan',
        'Too many credit inquiries',
      ],
    },
  },
};

export const SimpleView: Story = {
  args: {
    score: 700,
    maxScore: 850,
    showDetails: false,
  },
};

export const WithoutFactors: Story = {
  args: {
    score: 680,
    maxScore: 850,
    showDetails: true,
    lastUpdated: '2024-01-20',
    nextUpdate: '2024-02-20',
  },
};

export const CustomMaxScore: Story = {
  args: {
    score: 600,
    maxScore: 1000,
    showDetails: true,
    lastUpdated: '2024-01-15',
    factors: {
      positive: [
        'Account age improving',
        'No new credit inquiries',
      ],
      negative: [
        'Payment history needs improvement',
      ],
    },
  },
};

export const Interactive: Story = {
  args: {
    score: 650,
    maxScore: 850,
    showDetails: true,
    lastUpdated: '2024-01-15',
    nextUpdate: '2024-02-15',
    factors: {
      positive: [
        'Payment history improving',
        'Credit mix is good',
      ],
      negative: [
        'Consider reducing credit utilization',
        'Avoid new credit applications',
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive score gauge with animation. Adjust the score to see the gauge update.',
      },
    },
  },
};