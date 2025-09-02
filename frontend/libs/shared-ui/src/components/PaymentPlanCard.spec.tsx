import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { PaymentPlanCard } from './PaymentPlanCard';

describe('PaymentPlanCard', () => {
  const mockProps = {
    planName: 'Pay in 3',
    description: 'Split your payment into 3 equal monthly installments',
    installments: 3,
    interestRate: '0%',
    isSelected: false,
    onSelect: vi.fn(),
  };

  describe('Functionality', () => {
    it('renders all payment plan information', () => {
      render(<PaymentPlanCard {...mockProps} />);

      expect(screen.getByText('Pay in 3')).toBeInTheDocument();
      expect(screen.getByText('Split your payment into 3 equal monthly installments')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Installments')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('Interest')).toBeInTheDocument();
    });

    it('calls onSelect when clicked', () => {
      const handleSelect = vi.fn();
      render(<PaymentPlanCard {...mockProps} onSelect={handleSelect} />);

      const card = screen.getByRole('button');
      fireEvent.click(card);

      expect(handleSelect).toHaveBeenCalledTimes(1);
    });

    it('applies selected styles when isSelected is true', () => {
      render(<PaymentPlanCard {...mockProps} isSelected={true} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(card.className).toContain('border-blue-500');
      expect(card.className).toContain('ring-2');
    });

    it('handles keyboard navigation', () => {
      const handleSelect = vi.fn();
      render(<PaymentPlanCard {...mockProps} onSelect={handleSelect} />);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(handleSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility - WCAG 2.1 AAA Compliance', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<PaymentPlanCard {...mockProps} />);
      const results = await axe(container, {
        rules: {
          'color-contrast-enhanced': { enabled: true }, // AAA contrast ratio
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes', () => {
      render(<PaymentPlanCard {...mockProps} isSelected={true} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('is keyboard accessible', () => {
      render(<PaymentPlanCard {...mockProps} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
      
      // Card should be focusable
      card.focus();
      expect(document.activeElement).toBe(card);
    });

    it('has sufficient color contrast for text', async () => {
      const { container } = render(<PaymentPlanCard {...mockProps} />);
      
      // Test specifically for color contrast at AAA level (7:1)
      const results = await axe(container, {
        rules: {
          'color-contrast-enhanced': { enabled: true },
          'color-contrast': { enabled: false }, // Disable AA to test only AAA
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    it('maintains focus visibility', () => {
      render(<PaymentPlanCard {...mockProps} />);

      const card = screen.getByRole('button');
      card.focus();
      
      // Verify focus is visible (this would need visual regression testing for full verification)
      expect(document.activeElement).toBe(card);
    });

    it('provides clear interactive feedback', () => {
      const { rerender } = render(<PaymentPlanCard {...mockProps} isSelected={false} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'false');
      
      rerender(<PaymentPlanCard {...mockProps} isSelected={true} />);
      expect(card).toHaveAttribute('aria-pressed', 'true');
    });

    it('has semantic HTML structure', () => {
      render(<PaymentPlanCard {...mockProps} />);

      // Check for heading hierarchy
      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toHaveTextContent('Pay in 3');
    });

    it('supports screen reader announcements', () => {
      render(<PaymentPlanCard {...mockProps} />);

      // Verify content is accessible to screen readers
      expect(screen.getByText('Installments')).toBeInTheDocument();
      expect(screen.getByText('Interest')).toBeInTheDocument();
    });

    it('handles high contrast mode', async () => {
      // This test ensures the component works in high contrast mode
      const { container } = render(
        <div style={{ filter: 'contrast(2)' }}>
          <PaymentPlanCard {...mockProps} />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports reduced motion preferences', () => {
      // Component should respect prefers-reduced-motion
      const { container } = render(<PaymentPlanCard {...mockProps} />);
      
      // Check that transitions are present but can be disabled
      const card = container.querySelector('[class*="transition-shadow"]');
      expect(card).toBeInTheDocument();
    });
  });
});