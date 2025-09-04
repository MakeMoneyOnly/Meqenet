import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Button Component

A versatile button component that follows WCAG 2.1 AA accessibility standards.

## Accessibility Features
- **Keyboard Navigation**: Full keyboard support with Tab navigation
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Management**: Visible focus indicators with proper contrast ratios
- **Loading States**: Accessible loading indicators with screen reader announcements
- **Disabled States**: Proper handling of disabled buttons

## Usage Guidelines
- Use semantic button elements for actions
- Provide clear, descriptive button text
- Use appropriate button variants for different actions
- Ensure sufficient color contrast (4.5:1 minimum)
- Test with keyboard-only navigation
        `,
      },
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'danger'],
      description: 'Button style variant',
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows loading spinner and disables interaction',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables button interaction',
    },
    children: {
      control: 'text',
      description: 'Button content (should be descriptive)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Action',
  },
  parameters: {
    docs: {
      description: {
        story: 'Primary buttons for main actions. Use high contrast colors and clear labeling.',
      },
    },
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Action',
  },
  parameters: {
    docs: {
      description: {
        story: 'Secondary buttons for less prominent actions. Maintains accessibility with proper contrast.',
      },
    },
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete Account',
  },
  parameters: {
    docs: {
      description: {
        story: 'Danger buttons for destructive actions. Clear labeling is crucial for accessibility.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    isLoading: true,
    children: 'Saving Changes...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with spinner. Screen readers announce the loading state.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Submit Form',
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state. Button is not focusable and clearly indicates disabled status.',
      },
    },
  },
};

export const WithIcons: Story = {
  args: {
    variant: 'primary',
    children: '📧 Send Email',
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with icon. Ensure icons have proper alt text or are decorative only.',
      },
    },
  },
};

export const LongText: Story = {
  args: {
    variant: 'secondary',
    children: 'Submit Payment Information and Complete Transaction',
  },
  parameters: {
    docs: {
      description: {
        story: 'Long button text. Button should wrap properly and remain accessible.',
      },
    },
  },
};

export const AccessibilityExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
      <Button variant="primary" aria-label="Save your work to prevent data loss">
        💾 Save
      </Button>

      <Button
        variant="secondary"
        aria-describedby="download-description"
        onClick={() => {
          // eslint-disable-next-line no-alert
          alert('Download started');
        }}
      >
        📥 Download Report
      </Button>
      <div id="download-description" style={{ fontSize: '0.875rem', color: '#666' }}>
        Downloads the current report in PDF format
      </div>

      <Button variant="danger" disabled aria-label="Cannot delete admin account">
        🗑️ Delete Account
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
## Accessibility Examples

1. **ARIA Labels**: Use when button text alone isn't descriptive enough
2. **ARIA DescribedBy**: Link to additional explanatory text
3. **Disabled with Context**: Explain why a button is disabled
4. **Icon Buttons**: Always provide text alternatives for screen readers
        `,
      },
    },
  },
};
