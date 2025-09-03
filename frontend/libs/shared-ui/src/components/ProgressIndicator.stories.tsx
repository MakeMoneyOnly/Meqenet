import type { Meta, StoryObj } from '@storybook/react';
import { ProgressIndicator } from './ProgressIndicator';

const meta: Meta<typeof ProgressIndicator> = {
  component: ProgressIndicator,
  title: 'Financial/ProgressIndicator',
};

export default meta;
type Story = StoryObj<typeof ProgressIndicator>;

export const Default: Story = {
  args: {
    steps: ['Cart', 'Shipping', 'Payment', 'Confirmation'],
    currentStep: 1,
  },
};

export const Halfway: Story = {
  args: {
    ...Default.args,
    currentStep: 3,
  },
};

export const Complete: Story = {
  args: {
    ...Default.args,
    currentStep: 5, // currentStep is 1-based, so 5 means all 4 steps are complete
  },
};
