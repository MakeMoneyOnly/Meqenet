import type { Meta, StoryObj } from '@storybook/react';
import { PaymentMethodSelector, PaymentMethod } from './PaymentMethodSelector';
import { useState } from 'react';

const meta: Meta<typeof PaymentMethodSelector> = {
  title: 'Financial/PaymentMethodSelector',
  component: PaymentMethodSelector,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onSelect: { action: 'payment method selected' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const ethiopianPaymentMethods: PaymentMethod[] = [
  {
    id: 'telebirr-001',
    type: 'telebirr',
    name: 'Telebirr',
    description: 'Ethiopia\'s leading mobile money service',
    isDefault: true,
    balance: 5000,
    currency: 'ETB',
    isAvailable: true,
    processingFee: 0,
    estimatedTime: 'Instant',
  },
  {
    id: 'cbe-001',
    type: 'cbe_birr',
    name: 'CBE Birr',
    description: 'Commercial Bank of Ethiopia mobile banking',
    balance: 12000,
    currency: 'ETB',
    isAvailable: true,
    processingFee: 5,
    estimatedTime: '1-2 mins',
  },
  {
    id: 'hello-001',
    type: 'hellocash',
    name: 'HelloCash',
    description: 'Digital financial service by Belcash',
    balance: 3500,
    currency: 'ETB',
    isAvailable: true,
    processingFee: 10,
    estimatedTime: '2-3 mins',
  },
  {
    id: 'santim-001',
    type: 'santimpay',
    name: 'SantimPay',
    description: 'Amhara Bank mobile wallet',
    isAvailable: false,
    processingFee: 0,
    estimatedTime: 'Instant',
  },
  {
    id: 'arif-001',
    type: 'arifpay',
    name: 'ArifPay',
    description: 'Payment gateway for businesses',
    isAvailable: true,
    processingFee: 15,
    estimatedTime: '1-2 mins',
  },
  {
    id: 'chapa-001',
    type: 'chapa',
    name: 'Chapa',
    description: 'Modern payment gateway',
    isAvailable: true,
    processingFee: 20,
    estimatedTime: '1-3 mins',
  },
];

const cardPaymentMethods: PaymentMethod[] = [
  {
    id: 'card-001',
    type: 'card',
    name: 'Visa Debit Card',
    description: 'Commercial Bank of Ethiopia',
    lastFourDigits: '4532',
    expiryDate: '12/25',
    isDefault: true,
    isAvailable: true,
    processingFee: 25,
    estimatedTime: '1-2 mins',
  },
  {
    id: 'card-002',
    type: 'card',
    name: 'Mastercard',
    description: 'Dashen Bank',
    lastFourDigits: '8921',
    expiryDate: '09/24',
    isAvailable: true,
    processingFee: 25,
    estimatedTime: '1-2 mins',
  },
  {
    id: 'bank-001',
    type: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Direct transfer from your bank account',
    isAvailable: true,
    processingFee: 50,
    estimatedTime: '1-2 days',
  },
];

export const EthiopianMethods: Story = {
  args: {
    methods: ethiopianPaymentMethods,
    selectedMethodId: 'telebirr-001',
    showBalance: true,
    showFees: true,
    onSelect: (methodId) => console.log('Selected:', methodId),
  },
};

export const CardPayments: Story = {
  args: {
    methods: cardPaymentMethods,
    selectedMethodId: 'card-001',
    showBalance: false,
    showFees: true,
    onSelect: (methodId) => console.log('Selected:', methodId),
  },
};

export const NoSelection: Story = {
  args: {
    methods: ethiopianPaymentMethods,
    showBalance: false,
    showFees: false,
    onSelect: (methodId) => console.log('Selected:', methodId),
  },
};

export const WithUnavailable: Story = {
  args: {
    methods: ethiopianPaymentMethods,
    selectedMethodId: 'cbe-001',
    showBalance: true,
    showFees: true,
    onSelect: (methodId) => console.log('Selected:', methodId),
  },
};

export const MinimalInfo: Story = {
  args: {
    methods: ethiopianPaymentMethods.map(method => ({
      ...method,
      description: undefined,
      balance: undefined,
      processingFee: undefined,
      estimatedTime: undefined,
    })),
    showBalance: false,
    showFees: false,
    onSelect: (methodId) => console.log('Selected:', methodId),
  },
};

// Interactive story with state management
export const Interactive: Story = {
  render: (args) => {
    const [selectedId, setSelectedId] = useState<string>('telebirr-001');
    
    return (
      <PaymentMethodSelector
        {...args}
        selectedMethodId={selectedId}
        onSelect={(methodId) => {
          setSelectedId(methodId);
          args.onSelect?.(methodId);
        }}
      />
    );
  },
  args: {
    methods: ethiopianPaymentMethods,
    showBalance: true,
    showFees: true,
  },
};