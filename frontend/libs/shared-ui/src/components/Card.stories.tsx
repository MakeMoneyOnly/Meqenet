import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { Card, CardHeader, CardContent, CardFooter } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card style={{ width: '350px' }}>
      <CardHeader>
        <h3 className="text-lg font-semibold">Card Title</h3>
      </CardHeader>
      <CardContent>
        <p>
          This is the main content of the card. You can put any information you
          want here.
        </p>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-gray-600">Card Footer</p>
      </CardFooter>
    </Card>
  ),
};

export const WithoutHeader: Story = {
  render: () => (
    <Card style={{ width: '350px' }}>
      <CardContent>
        <p>This card does not have a header. The content starts directly.</p>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-gray-600">Card Footer</p>
      </CardFooter>
    </Card>
  ),
};

export const WithoutFooter: Story = {
  render: () => (
    <Card style={{ width: '350px' }}>
      <CardHeader>
        <h3 className="text-lg font-semibold">Card Title</h3>
      </CardHeader>
      <CardContent>
        <p>This card does not have a footer. The content is the last part.</p>
      </CardContent>
    </Card>
  ),
};

export const ContentOnly: Story = {
  render: () => (
    <Card style={{ width: '350px' }}>
      <CardContent>
        <p>This is a simple card with only a content section.</p>
      </CardContent>
    </Card>
  ),
};
