import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { Button } from './Button';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: { control: 'boolean' },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const ModalWithHooks = (): React.JSX.Element => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal title="My Modal" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <p>
          This is the content of the modal. You can put anything you want here.
        </p>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export const Default: Story = {
  render: () => <ModalWithHooks />,
};
